import {
  assertMinimumCount,
  assertNonNegativeInteger as assertSharedNonNegativeInteger,
  assertRequiredField,
  MIN_TOURNAMENT_PLAYERS,
  ValidationError,
  ValidationMessages,
} from '@shared/validation'
import {
  DEFAULT_TOURNAMENT_SCORING,
  TOURNAMENT_STATUSES,
  type CreateTournamentInput,
  type TournamentStatus,
} from '@shared/types/tournament'

export { assertNonEmptyString, nowIsoString, ValidationError } from '@modules/players/player.validation'

export function assertTournamentStatus(value: unknown, field = 'status'): TournamentStatus {
  if (typeof value !== 'string' || !TOURNAMENT_STATUSES.includes(value as TournamentStatus)) {
    throw new ValidationError(`${field} must be one of: ${TOURNAMENT_STATUSES.join(', ')}`)
  }

  return value as TournamentStatus
}

export function assertNonNegativeInteger(value: unknown, field: string): number {
  return assertSharedNonNegativeInteger(value, `${field} must be a non-negative integer`)
}

export function validateCreateTournamentInput(input: CreateTournamentInput): Required<
  Pick<CreateTournamentInput, 'name' | 'pointsWin' | 'pointsDraw' | 'pointsLoss'>
> {
  return {
    name: assertRequiredField(input.name, ValidationMessages.tournamentNameRequired),
    pointsWin:
      input.pointsWin !== undefined
        ? assertNonNegativeInteger(input.pointsWin, 'pointsWin')
        : DEFAULT_TOURNAMENT_SCORING.pointsWin,
    pointsDraw:
      input.pointsDraw !== undefined
        ? assertNonNegativeInteger(input.pointsDraw, 'pointsDraw')
        : DEFAULT_TOURNAMENT_SCORING.pointsDraw,
    pointsLoss:
      input.pointsLoss !== undefined
        ? assertNonNegativeInteger(input.pointsLoss, 'pointsLoss')
        : DEFAULT_TOURNAMENT_SCORING.pointsLoss,
  }
}

export function validatePlayerIds(playerIds: unknown): string[] {
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

  return [...new Set(validatedIds)]
}

export function validateTournamentPlayerSelection(playerIds: unknown): string[] {
  const validatedIds = validatePlayerIds(playerIds)

  assertMinimumCount(
    validatedIds.length,
    MIN_TOURNAMENT_PLAYERS,
    ValidationMessages.tournamentMinPlayers,
  )

  return validatedIds
}
