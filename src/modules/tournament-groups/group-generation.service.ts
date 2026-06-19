import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import { preferencesService } from '@modules/app/preferences.service'
import { TournamentPhaseService } from '@modules/tournament-phases/tournament-phase.service'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import { assertNonEmptyString } from '@modules/tournaments/tournament.validation'
import type {
  GenerateTournamentGroupsInput,
  GenerateTournamentGroupsResult,
  TournamentGroupWithPlayers,
} from '@shared/types/tournament-group'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { createValidationError } from '@shared/validation/errors'
import {
  buildSnakeGroupAssignments,
  getGroupName,
} from './group-generation.calculator'
import { validateGenerateTournamentGroupsInput } from './group-generation.validation'
import { TournamentGroupRepository } from './tournament-group.repository'

export class GroupGenerationService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly tournamentGroupRepository: TournamentGroupRepository = new TournamentGroupRepository(
      db,
    ),
    private readonly tournamentPhaseService: TournamentPhaseService = new TournamentPhaseService(db),
  ) {}

  generateGroups(input: GenerateTournamentGroupsInput): GenerateTournamentGroupsResult {
    const validated = validateGenerateTournamentGroupsInput(input)

    if (!this.tournamentRepository.getTournamentById(validated.tournamentId)) {
      throw createValidationError('errors.tournamentNotFound', { id: validated.tournamentId })
    }

    const rosterPlayerIds = new Set(
      this.tournamentRepository
        .getTournamentPlayers(validated.tournamentId)
        .map((player) => player.id),
    )

    for (const playerId of validated.playerIds) {
      if (!rosterPlayerIds.has(playerId)) {
        throw createValidationError('errors.playerNotRegistered', { id: playerId })
      }
    }

    const groupStagePhase = this.tournamentPhaseService
      .getTournamentPhases(validated.tournamentId)
      .find(
        (phase) =>
          phase.phaseType === TournamentPhaseType.GROUP_STAGE && phase.status === 'active',
      )

    if (!groupStagePhase) {
      throw createValidationError('errors.activeGroupStageNotFound')
    }

    if (this.tournamentGroupRepository.countGroupsByPhase(groupStagePhase.id) > 0) {
      throw createValidationError('errors.groupsAlreadyGenerated')
    }

    const seedPositionByPlayerId = new Map(
      validated.playerIds.map((playerId, index) => [playerId, index + 1]),
    )
    const groupAssignments = buildSnakeGroupAssignments(
      validated.playerIds,
      validated.groupCount,
    )

    const locale = preferencesService.getLocale()

    const generateGroups = this.db.transaction((): TournamentGroupWithPlayers[] =>
      groupAssignments.map(({ orderIndex, playerIds }) => {
        const group = this.tournamentGroupRepository.createGroup({
          tournamentId: validated.tournamentId,
          phaseId: groupStagePhase.id,
          name: getGroupName(orderIndex, locale),
          orderIndex,
        })

        const players = playerIds.map((playerId) => {
          const assignment = this.tournamentGroupRepository.addPlayerToGroup({
            groupId: group.id,
            playerId,
            seedPosition: seedPositionByPlayerId.get(playerId)!,
          })

          return {
            playerId: assignment.playerId,
            seedPosition: assignment.seedPosition!,
          }
        })

        return {
          ...group,
          players,
        }
      }),
    )

    return { groups: generateGroups() }
  }

  listGroupsWithPlayers(tournamentId: string): TournamentGroupWithPlayers[] {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')

    if (!this.tournamentRepository.getTournamentById(validatedTournamentId)) {
      throw createValidationError('errors.tournamentNotFound', { id: validatedTournamentId })
    }

    const groupStagePhase = this.tournamentPhaseService
      .getTournamentPhases(validatedTournamentId)
      .find((phase) => phase.phaseType === TournamentPhaseType.GROUP_STAGE)

    if (!groupStagePhase) {
      return []
    }

    return this.tournamentGroupRepository.listGroupsByPhase(groupStagePhase.id).map((group) => ({
      ...group,
      players: this.tournamentGroupRepository.listGroupPlayersByGroupId(group.id).map((player) => ({
        playerId: player.playerId,
        seedPosition: player.seedPosition ?? 0,
      })),
    }))
  }
}
