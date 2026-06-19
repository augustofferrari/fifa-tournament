import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import { GroupStandingsService } from '@modules/tournament-groups/group-standings.service'
import { MatchRepository } from '@modules/matches/match.repository'
import {
  BracketMatchRepository,
  getBracketRoundInsertionOrder,
} from '@modules/tournament-playoffs'
import { TournamentPhaseService } from '@modules/tournament-phases/tournament-phase.service'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import { ValidationError } from '@modules/tournaments/tournament.validation'
import type { GenerateKnockoutInput, GenerateKnockoutResult } from '@shared/types/tournament-knockout'
import { TournamentFormat } from '@shared/types/tournament-format'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import {
  buildKnockoutBracketPlan,
  getGroupLetter,
  type GroupQualifier,
} from './knockout-bracket.calculator'
import {
  validateGenerateKnockoutInput,
  validateKnockoutBracketSize,
} from './knockout-generation.validation'

export class KnockoutGenerationService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly tournamentPhaseService: TournamentPhaseService = new TournamentPhaseService(db),
    private readonly matchRepository: MatchRepository = new MatchRepository(db),
    private readonly bracketMatchRepository: BracketMatchRepository = new BracketMatchRepository(db),
    private readonly groupStandingsService: GroupStandingsService = new GroupStandingsService(db),
  ) {}

  generateKnockout(input: GenerateKnockoutInput): GenerateKnockoutResult {
    const validated = validateGenerateKnockoutInput(input)
    const tournament = this.tournamentRepository.getTournamentById(validated.tournamentId)

    if (!tournament) {
      throw new ValidationError(`Tournament not found: ${validated.tournamentId}`)
    }

    if (tournament.format !== TournamentFormat.GROUPS_KNOCKOUT) {
      throw new ValidationError('Knockout can only be generated for groups plus knockout tournaments')
    }

    const phases = this.tournamentPhaseService.getTournamentPhases(validated.tournamentId)
    const groupStagePhase = phases.find(
      (phase) => phase.phaseType === TournamentPhaseType.GROUP_STAGE,
    )
    const knockoutPhase = phases.find((phase) => phase.phaseType === TournamentPhaseType.KNOCKOUT)

    if (!groupStagePhase || !knockoutPhase) {
      throw new ValidationError('Tournament phases are not configured for knockout')
    }

    if (this.bracketMatchRepository.countBracketMatchesByPhase(knockoutPhase.id) > 0) {
      throw new ValidationError('Knockout has already been generated for this tournament')
    }

    if (knockoutPhase.status !== 'pending') {
      throw new ValidationError('Knockout phase is not available for generation')
    }

    const groupStageMatches = this.matchRepository
      .listMatchesByTournament({ tournamentId: validated.tournamentId })
      .filter((match) => match.phaseId === groupStagePhase.id)

    if (groupStageMatches.length === 0) {
      throw new ValidationError('Group stage fixture must be generated before knockout')
    }

    const unplayedMatches = groupStageMatches.filter(
      (match) =>
        match.status !== 'played' || match.homeGoals === null || match.awayGoals === null,
    )

    if (unplayedMatches.length > 0) {
      throw new ValidationError('All group stage matches must be played before generating knockout')
    }

    if (groupStagePhase.status !== 'completed') {
      throw new ValidationError('Group stage phase must be completed before generating knockout')
    }

    const groupStandings = this.groupStandingsService.getGroupStandings(validated.tournamentId)

    if (groupStandings.length === 0) {
      throw new ValidationError('Groups must be generated before knockout')
    }

    validateKnockoutBracketSize(groupStandings.length, validated.qualifiersPerGroup)

    const groupQualifiers: GroupQualifier[] = groupStandings.map((group) => {
      if (group.standings.length < validated.qualifiersPerGroup) {
        throw new ValidationError(
          `Group "${group.groupName}" does not have enough players for ${validated.qualifiersPerGroup} qualifiers`,
        )
      }

      return {
        groupLetter: getGroupLetter(group.groupName),
        playerIds: group.standings
          .slice(0, validated.qualifiersPerGroup)
          .map((row) => row.playerId),
      }
    })

    const bracketPlan = buildKnockoutBracketPlan(groupQualifiers, validated.qualifiersPerGroup)
    const bracketInsertionOrder = [...bracketPlan].sort(
      (left, right) =>
        getBracketRoundInsertionOrder(left.bracketRound) -
        getBracketRoundInsertionOrder(right.bracketRound),
    )

    const generateKnockout = this.db.transaction((): GenerateKnockoutResult => {
      const activatedKnockoutPhase = this.tournamentPhaseService.activateNextPhase(
        validated.tournamentId,
      )

      if (activatedKnockoutPhase.id !== knockoutPhase.id) {
        throw new ValidationError('Unable to activate knockout phase')
      }

      const firstRoundMatches = []

      for (const node of bracketInsertionOrder) {
        let matchId: string | null = null

        if (node.isFirstRound) {
          if (!node.homePlayerId || !node.awayPlayerId) {
            throw new ValidationError('Unable to resolve qualified players for the first knockout round')
          }

          const match = this.matchRepository.createMatch({
            tournamentId: validated.tournamentId,
            phaseId: activatedKnockoutPhase.id,
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
          phaseId: activatedKnockoutPhase.id,
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
        knockoutPhaseId: activatedKnockoutPhase.id,
        bracketMatches: this.bracketMatchRepository.listBracketMatchesByPhase(
          activatedKnockoutPhase.id,
        ),
        firstRoundMatches,
      }
    })

    return generateKnockout()
  }
}
