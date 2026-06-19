import { ValidationError } from '@shared/validation'
import {
  MIN_PLAYERS_PER_GROUP,
  MIN_TOURNAMENT_GROUP_COUNT,
} from './group-generation.calculator'
import type { GenerateTournamentGroupsInput } from '@shared/types/tournament-group'

export interface ValidatedGenerateTournamentGroupsInput {
  tournamentId: string
  groupCount: number
  playerIds: string[]
}

function assertPositiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ValidationError(`${field} must be a positive integer`)
  }

  return value
}

function validatePlayerIds(playerIds: unknown): string[] {
  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    throw new ValidationError('playerIds must be a non-empty array')
  }

  const validatedIds: string[] = []

  for (const [index, playerId] of playerIds.entries()) {
    if (typeof playerId !== 'string' || playerId.trim().length === 0) {
      throw new ValidationError(`playerIds[${index}] is required`)
    }

    validatedIds.push(playerId.trim())
  }

  const uniqueIds = [...new Set(validatedIds)]

  if (uniqueIds.length !== validatedIds.length) {
    throw new ValidationError('A player cannot be assigned to more than one group')
  }

  return uniqueIds
}

export function validateGenerateTournamentGroupsInput(
  input: GenerateTournamentGroupsInput,
): ValidatedGenerateTournamentGroupsInput {
  const tournamentId =
    typeof input.tournamentId === 'string' && input.tournamentId.trim().length > 0
      ? input.tournamentId.trim()
      : (() => {
          throw new ValidationError('tournamentId is required')
        })()

  const groupCount = assertPositiveInteger(input.groupCount, 'groupCount')

  if (groupCount < MIN_TOURNAMENT_GROUP_COUNT) {
    throw new ValidationError(`groupCount must be at least ${MIN_TOURNAMENT_GROUP_COUNT}`)
  }

  const playerIds = validatePlayerIds(input.playerIds)
  const minimumPlayers = groupCount * MIN_PLAYERS_PER_GROUP

  if (playerIds.length < minimumPlayers) {
    throw new ValidationError(
      `At least ${minimumPlayers} players are required for ${groupCount} groups`,
    )
  }

  return {
    tournamentId,
    groupCount,
    playerIds,
  }
}
