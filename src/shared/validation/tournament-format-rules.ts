import { TournamentFormat, type TournamentFormatConfig } from '@shared/types/tournament-format'
import {
  getKnockoutOnlyBracketSize,
  isSupportedPlayoffQualifiedCount,
  MAX_KNOCKOUT_ONLY_PLAYERS,
  SUPPORTED_PLAYOFF_QUALIFIED_COUNTS,
  validateKnockoutBracketSize,
} from '@shared/tournament/bracket.utils'
import { ValidationError } from './errors'

export const MIN_ROUND_ROBIN_PLAYERS = 2
export const MIN_ROUND_ROBIN_PLAYOFFS_PLAYERS = 3
export const MIN_GROUPS_KNOCKOUT_PLAYERS = 4
export const MIN_KNOCKOUT_ONLY_TOURNAMENT_PLAYERS = 2

export function getMinimumPlayersForFormat(format: TournamentFormat): number {
  switch (format) {
    case TournamentFormat.ROUND_ROBIN:
      return MIN_ROUND_ROBIN_PLAYERS
    case TournamentFormat.ROUND_ROBIN_PLAYOFFS:
      return MIN_ROUND_ROBIN_PLAYOFFS_PLAYERS
    case TournamentFormat.GROUPS_KNOCKOUT:
      return MIN_GROUPS_KNOCKOUT_PLAYERS
    case TournamentFormat.KNOCKOUT_ONLY:
      return MIN_KNOCKOUT_ONLY_TOURNAMENT_PLAYERS
  }
}

export function assertSupportedPlayoffQualifiedCount(
  value: number,
  field = 'playoffQualifiedCount',
): void {
  if (!isSupportedPlayoffQualifiedCount(value)) {
    throw new ValidationError(
      `${field} must be one of ${SUPPORTED_PLAYOFF_QUALIFIED_COUNTS.join(', ')}`,
    )
  }
}

export function assertGroupCountAtLeastTwo(groupCount: number): void {
  if (groupCount < 2) {
    throw new ValidationError('groupCount must be at least 2')
  }
}

export function assertQualifiersPerGroupAtLeastOne(qualifiersPerGroup: number): void {
  if (qualifiersPerGroup < 1) {
    throw new ValidationError('qualifiersPerGroup must be at least 1')
  }
}

export function validateGroupsKnockoutBracketTotals(
  groupCount: number,
  qualifiersPerGroup: number,
): void {
  assertGroupCountAtLeastTwo(groupCount)
  assertQualifiersPerGroupAtLeastOne(qualifiersPerGroup)
  validateKnockoutBracketSize(groupCount, qualifiersPerGroup)
}

export function validateTournamentFormatPlayerRules(
  format: TournamentFormat,
  config: Pick<
    TournamentFormatConfig,
    'playoffQualifiedCount' | 'groupCount' | 'playersPerGroup'
  >,
  playerCount: number,
): void {
  const minimumPlayers = getMinimumPlayersForFormat(format)

  if (playerCount < minimumPlayers) {
    throw new ValidationError(
      `${format} requires at least ${minimumPlayers} players (selected ${playerCount})`,
    )
  }

  switch (format) {
    case TournamentFormat.ROUND_ROBIN:
      return
    case TournamentFormat.ROUND_ROBIN_PLAYOFFS: {
      const qualifiedCount = config.playoffQualifiedCount

      if (qualifiedCount === null) {
        throw new ValidationError('playoffQualifiedCount is required for ROUND_ROBIN_PLAYOFFS')
      }

      assertSupportedPlayoffQualifiedCount(qualifiedCount)

      if (qualifiedCount > playerCount) {
        throw new ValidationError(
          `playoffQualifiedCount cannot exceed player count (${qualifiedCount} > ${playerCount})`,
        )
      }
      return
    }
    case TournamentFormat.GROUPS_KNOCKOUT: {
      const groupCount = config.groupCount
      const qualifiersPerGroup = config.playoffQualifiedCount

      if (groupCount === null || qualifiersPerGroup === null) {
        throw new ValidationError('groupCount and qualifiersPerGroup are required for GROUPS_KNOCKOUT')
      }

      validateGroupsKnockoutBracketTotals(groupCount, qualifiersPerGroup)
      return
    }
    case TournamentFormat.KNOCKOUT_ONLY: {
      try {
        getKnockoutOnlyBracketSize(playerCount)
      } catch {
        throw new ValidationError(
          `KNOCKOUT_ONLY supports ${MIN_KNOCKOUT_ONLY_TOURNAMENT_PLAYERS} to ${MAX_KNOCKOUT_ONLY_PLAYERS} players`,
        )
      }
    }
  }
}
