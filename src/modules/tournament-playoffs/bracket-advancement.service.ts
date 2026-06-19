import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import { MatchRepository } from '@modules/matches/match.repository'
import { TournamentPhaseService } from '@modules/tournament-phases/tournament-phase.service'
import type { Match } from '@shared/types/match'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { validateMatchResultForPhase } from '@shared/validation/match-result.validation'
import {
  determineMatchWinnerPlayerId,
  getRoundNumberForBracketRound,
  isReadyForScheduledMatch,
  resolveBracketMatchParticipants,
} from './bracket-advancement.calculator'
import { BracketMatchRepository } from './bracket-match.repository'

export class BracketAdvancementService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly bracketMatchRepository: BracketMatchRepository = new BracketMatchRepository(db),
    private readonly tournamentPhaseService: TournamentPhaseService = new TournamentPhaseService(db),
    private readonly matchRepository: MatchRepository,
  ) {}

  assertKnockoutMatchHasWinner(homeGoals: number, awayGoals: number): void {
    this.validateKnockoutPhaseResult(TournamentPhaseType.KNOCKOUT, homeGoals, awayGoals)
  }

  private validateKnockoutPhaseResult(
    phaseType: TournamentPhaseType,
    homeGoals: number,
    awayGoals: number,
  ): void {
    validateMatchResultForPhase(phaseType, homeGoals, awayGoals)
  }

  isKnockoutPhaseType(phaseType: TournamentPhaseType): boolean {
    return (
      phaseType === TournamentPhaseType.PLAYOFF || phaseType === TournamentPhaseType.KNOCKOUT
    )
  }

  processMatchResult(match: Match, homeGoals: number, awayGoals: number): void {
    const bracketMatch = this.bracketMatchRepository.getBracketMatchByMatchId(match.id)

    if (!bracketMatch) {
      return
    }

    const phase = this.tournamentPhaseService
      .getTournamentPhases(match.tournamentId)
      .find((entry) => entry.id === match.phaseId)

    if (!phase || !this.isKnockoutPhaseType(phase.phaseType)) {
      return
    }

    this.validateKnockoutPhaseResult(phase.phaseType, homeGoals, awayGoals)

    const winnerPlayerId = determineMatchWinnerPlayerId(match, homeGoals, awayGoals)
    this.bracketMatchRepository.setWinnerPlayerId(bracketMatch.id, winnerPlayerId)

    const phaseBracketMatches = this.bracketMatchRepository.listBracketMatchesByPhase(
      bracketMatch.phaseId,
    )
    const bracketMatchesById = new Map(
      phaseBracketMatches.map((entry) => [entry.id, entry]),
    )
    bracketMatchesById.set(bracketMatch.id, {
      ...bracketMatch,
      winnerPlayerId,
    })

    if (bracketMatch.nextMatchId) {
      this.tryScheduleNextBracketMatch(bracketMatch.nextMatchId, bracketMatchesById)
    }
  }

  private tryScheduleNextBracketMatch(
    bracketMatchId: string,
    bracketMatchesById: Map<string, import('@shared/types/bracket-match').BracketMatch>,
  ): void {
    const bracketMatch = bracketMatchesById.get(bracketMatchId)

    if (!bracketMatch || !isReadyForScheduledMatch(bracketMatch, bracketMatchesById)) {
      return
    }

    const { homePlayerId, awayPlayerId } = resolveBracketMatchParticipants(
      bracketMatch,
      bracketMatchesById,
    )

    if (!homePlayerId || !awayPlayerId) {
      return
    }

    const nextMatch = this.matchRepository.createMatch({
      tournamentId: bracketMatch.tournamentId,
      phaseId: bracketMatch.phaseId,
      roundNumber: getRoundNumberForBracketRound(bracketMatch.bracketRound),
      homePlayerId,
      awayPlayerId,
      bracketRound: bracketMatch.bracketRound,
      bracketPosition: bracketMatch.bracketPosition,
    })

    const updatedBracketMatch = this.bracketMatchRepository.setMatchId(
      bracketMatch.id,
      nextMatch.id,
    )
    bracketMatchesById.set(updatedBracketMatch.id, updatedBracketMatch)
  }
}
