import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import { MatchRepository } from '@modules/matches/match.repository'
import { TournamentPhaseService } from '@modules/tournament-phases/tournament-phase.service'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import { ValidationError } from '@modules/tournaments/tournament.validation'
import type { Match } from '@shared/types/match'
import type { GeneratePlayoffsInput, GeneratePlayoffsResult } from '@shared/types/tournament-playoff'
import { TournamentFormat } from '@shared/types/tournament-format'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { BracketMatchRepository } from './bracket-match.repository'
import {
  buildPlayoffBracketPlan,
  getBracketRoundInsertionOrder,
} from './playoff-bracket.calculator'
import { validateGeneratePlayoffsInput } from './playoff-generation.validation'

export class PlayoffGenerationService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly tournamentPhaseService: TournamentPhaseService = new TournamentPhaseService(db),
    private readonly matchRepository: MatchRepository = new MatchRepository(db),
    private readonly bracketMatchRepository: BracketMatchRepository = new BracketMatchRepository(db),
  ) {}

  generatePlayoffs(input: GeneratePlayoffsInput): GeneratePlayoffsResult {
    const validated = validateGeneratePlayoffsInput(input)
    const tournament = this.tournamentRepository.getTournamentById(validated.tournamentId)

    if (!tournament) {
      throw new ValidationError(`Tournament not found: ${validated.tournamentId}`)
    }

    if (tournament.format !== TournamentFormat.ROUND_ROBIN_PLAYOFFS) {
      throw new ValidationError('Playoffs can only be generated for round robin plus playoffs tournaments')
    }

    const phases = this.tournamentPhaseService.getTournamentPhases(validated.tournamentId)
    const regularSeasonPhase = phases.find(
      (phase) => phase.phaseType === TournamentPhaseType.ROUND_ROBIN,
    )
    const playoffPhase = phases.find((phase) => phase.phaseType === TournamentPhaseType.PLAYOFF)

    if (!regularSeasonPhase || !playoffPhase) {
      throw new ValidationError('Tournament phases are not configured for playoffs')
    }

    if (this.bracketMatchRepository.countBracketMatchesByPhase(playoffPhase.id) > 0) {
      throw new ValidationError('Playoffs have already been generated for this tournament')
    }

    if (playoffPhase.status !== 'pending') {
      throw new ValidationError('Playoff phase is not available for generation')
    }

    const regularSeasonMatches = this.matchRepository
      .listMatchesByTournament({ tournamentId: validated.tournamentId })
      .filter((match) => match.phaseId === regularSeasonPhase.id)

    if (regularSeasonMatches.length === 0) {
      throw new ValidationError('Regular season fixture must be generated before playoffs')
    }

    const unplayedMatches = regularSeasonMatches.filter(
      (match) =>
        match.status !== 'played' || match.homeGoals === null || match.awayGoals === null,
    )

    if (unplayedMatches.length > 0) {
      throw new ValidationError('All regular season matches must be played before generating playoffs')
    }

    if (regularSeasonPhase.status !== 'completed') {
      throw new ValidationError('Regular season phase must be completed before generating playoffs')
    }

    const standings = this.tournamentRepository.getTournamentStandings(validated.tournamentId)

    if (standings.length < validated.qualifiedCount) {
      throw new ValidationError(
        `At least ${validated.qualifiedCount} players are required in standings for playoffs`,
      )
    }

    const qualifiedPlayerIds = standings
      .slice(0, validated.qualifiedCount)
      .map((row) => row.playerId)
    const bracketPlan = buildPlayoffBracketPlan(qualifiedPlayerIds)
    const bracketInsertionOrder = [...bracketPlan].sort(
      (left, right) =>
        getBracketRoundInsertionOrder(left.bracketRound) -
        getBracketRoundInsertionOrder(right.bracketRound),
    )

    const generatePlayoffs = this.db.transaction((): GeneratePlayoffsResult => {
      const activatedPlayoffPhase = this.tournamentPhaseService.activateNextPhase(
        validated.tournamentId,
      )

      if (activatedPlayoffPhase.id !== playoffPhase.id) {
        throw new ValidationError('Unable to activate playoff phase')
      }

      const firstRoundMatches: Match[] = []

      for (const node of bracketInsertionOrder) {
        let matchId: string | null = null

        if (node.isFirstRound) {
          if (!node.homePlayerId || !node.awayPlayerId) {
            throw new ValidationError('Unable to resolve qualified players for the first playoff round')
          }

          const match = this.matchRepository.createMatch({
            tournamentId: validated.tournamentId,
            phaseId: activatedPlayoffPhase.id,
            roundNumber: 1,
            homePlayerId: node.homePlayerId,
            awayPlayerId: node.awayPlayerId,
            bracketRound: node.bracketRound,
            bracketPosition: node.bracketPosition,
          })

          matchId = match.id
          firstRoundMatches.push(match)
        }

        this.bracketMatchRepository.createBracketMatch({
          id: node.id,
          tournamentId: validated.tournamentId,
          phaseId: activatedPlayoffPhase.id,
          matchId,
          bracketRound: node.bracketRound,
          bracketPosition: node.bracketPosition,
          homeSourceType: node.homeSourceType,
          homeSourceRef: node.homeSourceRef,
          awaySourceType: node.awaySourceType,
          awaySourceRef: node.awaySourceRef,
          nextMatchId: node.nextMatchId,
          nextMatchSlot: node.nextMatchSlot,
        })
      }

      return {
        playoffPhaseId: activatedPlayoffPhase.id,
        bracketMatches: this.bracketMatchRepository.listBracketMatchesByPhase(
          activatedPlayoffPhase.id,
        ),
        firstRoundMatches,
      }
    })

    return generatePlayoffs()
  }
}
