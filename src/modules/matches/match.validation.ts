import { ValidationError, validateMatchResultGoals } from '@shared/validation'
import type { CreateMatchInput } from '@shared/types/match'
import { assertNonEmptyString } from '@modules/tournaments/tournament.validation'

export { ValidationError, validateMatchResultGoals }

export interface ValidatedCreateMatchInput {
  tournamentId: string
  phaseId: string
  roundNumber: number
  homePlayerId: string
  awayPlayerId: string
  groupId: string | null
  bracketRound: string | null
  bracketPosition: number | null
}

function assertOptionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string`)
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function assertOptionalPositiveInteger(value: unknown, field: string): number | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ValidationError(`${field} must be a positive integer`)
  }

  return value
}

function assertRoundNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ValidationError('roundNumber must be a positive integer')
  }

  return value
}

export function validateCreateMatchInput(input: CreateMatchInput): ValidatedCreateMatchInput {
  return {
    tournamentId: assertNonEmptyString(input.tournamentId, 'tournamentId'),
    phaseId: assertNonEmptyString(input.phaseId, 'phaseId'),
    roundNumber: assertRoundNumber(input.roundNumber),
    homePlayerId: assertNonEmptyString(input.homePlayerId, 'homePlayerId'),
    awayPlayerId: assertNonEmptyString(input.awayPlayerId, 'awayPlayerId'),
    groupId: assertOptionalString(input.groupId, 'groupId'),
    bracketRound: assertOptionalString(input.bracketRound, 'bracketRound'),
    bracketPosition: assertOptionalPositiveInteger(input.bracketPosition, 'bracketPosition'),
  }
}

