import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import { MatchRepository } from '@modules/matches/match.repository'
import {
  BracketMatchRepository,
  getBracketRoundInsertionOrder,
} from '@modules/tournament-playoffs'
import { TournamentPhaseService } from '@modules/tournament-phases/tournament-phase.service'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import { nowIsoString, ValidationError } from '@modules/tournaments/tournament.validation'
import type {
  GenerateKnockoutOnlyInput,
  GenerateKnockoutOnlyResult,
} from '@shared/types/tournament-knockout'
import { TournamentFormat } from '@shared/types/tournament-format'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import {
  buildKnockoutOnlyBracketPlan,
  getAdvancedByePlayerIds,
} from './knockout-only-bracket.calculator'
import { validateGenerateKnockoutOnlyInput } from './knockout-only-generation.validation'

export class KnockoutOnlyGenerationService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly tournamentPhaseService: TournamentPhaseService = new TournamentPhaseService(db),
    private readonly matchRepository: MatchRepository = new MatchRepository(db),
    private readonly bracketMatchRepository: BracketMatchRepository = new BracketMatchRepository(db),
  ) {}

  generateKnockout(input: GenerateKnockoutOnlyInput): GenerateKnockoutOnlyResult {
    const validated = validateGenerateKnockoutOnlyInput(input)
    const tournament = this.tournamentRepository.getTournamentById(validated.tournamentId)

    if (!tournament) {
      throw new ValidationError(`Tournament not found: ${validated.tournamentId}`)
    }

    if (tournament.format !== TournamentFormat.KNOCKOUT_ONLY) {
      throw new ValidationError('Knockout bracket can only be generated for knockout-only tournaments')
    }

    const phases = this.tournamentPhaseService.getTournamentPhases(validated.tournamentId)
    const knockoutPhase = phases.find((phase) => phase.phaseType === TournamentPhaseType.KNOCKOUT)

    if (!knockoutPhase) {
      throw new ValidationError('Tournament phases are not configured for knockout')
    }

    if (this.bracketMatchRepository.countBracketMatchesByPhase(knockoutPhase.id) > 0) {
      throw new ValidationError('Knockout has already been generated for this tournament')
    }

    if (tournament.status !== 'draft') {
      throw new ValidationError('Knockout bracket can only be generated for draft tournaments')
    }

    if (knockoutPhase.status !== 'active') {
      throw new ValidationError('Knockout phase must be active to generate the bracket')
    }

    const rosterPlayerIds = new Set(
      this.tournamentRepository
        .getTournamentPlayers(validated.tournamentId)
        .map((player) => player.id),
    )

    for (const playerId of validated.playerIds) {
      if (!rosterPlayerIds.has(playerId)) {
        throw new ValidationError(`Player is not registered in this tournament: ${playerId}`)
      }
    }

    const bracketPlan = buildKnockoutOnlyBracketPlan(validated.playerIds)
    const bracketInsertionOrder = [...bracketPlan].sort(
      (left, right) =>
        getBracketRoundInsertionOrder(left.bracketRound) -
        getBracketRoundInsertionOrder(right.bracketRound),
    )

    const generateKnockout = this.db.transaction((): GenerateKnockoutOnlyResult => {
      const firstRoundMatches = []

      for (const node of bracketInsertionOrder) {
        let matchId: string | null = null

        if (node.isFirstRound && node.createsMatch) {
          if (!node.homePlayerId || !node.awayPlayerId) {
            throw new ValidationError('Unable to resolve players for the first knockout round')
          }

          const match = this.matchRepository.createMatch({
            tournamentId: validated.tournamentId,
            phaseId: knockoutPhase.id,
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
          phaseId: knockoutPhase.id,
          matchId,
          bracketRound: node.bracketRound,
          bracketPosition: node.bracketPosition,
          homeSourceType: node.homeSourceType,
          homeSourceRef: node.homeSourceRef,
          awaySourceType: node.awaySourceType,
          awaySourceRef: node.awaySourceRef,
          winnerPlayerId: node.winnerPlayerId,
          nextMatchId: node.nextMatchId,
          nextMatchSlot: node.nextMatchSlot,
        })
      }

      const updatedAt = nowIsoString()
      this.db
        .prepare(`UPDATE tournaments SET status = ?, updated_at = ? WHERE id = ?`)
        .run('active', updatedAt, validated.tournamentId)

      return {
        knockoutPhaseId: knockoutPhase.id,
        bracketMatches: this.bracketMatchRepository.listBracketMatchesByPhase(knockoutPhase.id),
        firstRoundMatches,
        advancedByePlayerIds: getAdvancedByePlayerIds(bracketPlan),
      }
    })

    return generateKnockout()
  }
}
