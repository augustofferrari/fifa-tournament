import { ValidationError } from '@shared/validation'

export const SUPPORTED_PLAYOFF_QUALIFIED_COUNTS = [2, 4, 8, 16] as const

export type PlayoffQualifiedCount = (typeof SUPPORTED_PLAYOFF_QUALIFIED_COUNTS)[number]

export const MIN_KNOCKOUT_ONLY_PLAYERS = 2
export const MAX_KNOCKOUT_ONLY_PLAYERS = 16

export function isSupportedPlayoffQualifiedCount(value: number): value is PlayoffQualifiedCount {
  return SUPPORTED_PLAYOFF_QUALIFIED_COUNTS.includes(value as PlayoffQualifiedCount)
}

export function getKnockoutOnlyBracketSize(playerCount: number): PlayoffQualifiedCount {
  if (playerCount < MIN_KNOCKOUT_ONLY_PLAYERS) {
    throw new Error(`At least ${MIN_KNOCKOUT_ONLY_PLAYERS} players are required`)
  }

  if (playerCount <= 2) {
    return 2
  }

  if (playerCount <= 4) {
    return 4
  }

  if (playerCount <= 8) {
    return 8
  }

  if (playerCount <= MAX_KNOCKOUT_ONLY_PLAYERS) {
    return 16
  }

  throw new Error(`At most ${MAX_KNOCKOUT_ONLY_PLAYERS} players are supported`)
}

export function validateKnockoutBracketSize(groupCount: number, qualifiersPerGroup: number): void {
  if (groupCount < 2) {
    throw new ValidationError('At least 2 groups are required for knockout generation')
  }

  if (groupCount % 2 !== 0) {
    throw new ValidationError('Group count must be even for balanced knockout pairings')
  }

  const totalQualified = groupCount * qualifiersPerGroup

  if (!isSupportedPlayoffQualifiedCount(totalQualified)) {
    throw new ValidationError(
      'Total qualified players must produce a knockout bracket of 2, 4, 8, or 16 teams',
    )
  }
}
