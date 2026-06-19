import {
  getDefaultConfigForFormat,
  TOURNAMENT_FORMATS,
  TournamentFormat,
  type TournamentFormatConfig,
} from '@shared/types/tournament-format'
import {
  assertGroupCountAtLeastTwo,
  assertQualifiersPerGroupAtLeastOne,
  assertSupportedPlayoffQualifiedCount,
  validateGroupsKnockoutBracketTotals,
} from './tournament-format-rules'
import { ValidationError } from './errors'

export interface TournamentFormatConfigInput {
  format?: unknown
  hasGroupStage?: unknown
  hasPlayoffs?: unknown
  hasKnockoutStage?: unknown
  playoffQualifiedCount?: unknown
  groupCount?: unknown
  playersPerGroup?: unknown
}

function assertTournamentFormat(value: unknown, field = 'format'): TournamentFormat {
  if (typeof value !== 'string' || !TOURNAMENT_FORMATS.includes(value as TournamentFormat)) {
    throw new ValidationError(`${field} must be one of: ${TOURNAMENT_FORMATS.join(', ')}`)
  }

  return value as TournamentFormat
}

function assertOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'boolean') {
    throw new ValidationError(`${field} must be a boolean`)
  }

  return value
}

function parseOptionalPositiveInteger(value: unknown, field: string): number | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      return null
    }

    const parsed = Number.parseInt(trimmed, 10)

    if (Number.isNaN(parsed) || parsed < 1) {
      throw new ValidationError(`${field} must be a positive integer`)
    }

    return parsed
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ValidationError(`${field} must be a positive integer`)
  }

  return value
}

function assertRequiredPositiveInteger(
  value: unknown,
  field: string,
  format: TournamentFormat,
): number {
  const parsed = parseOptionalPositiveInteger(value, field)

  if (parsed === null) {
    throw new ValidationError(`${field} is required for format ${format}`)
  }

  return parsed
}

function assertStageFlagMatchesFormat(
  value: boolean | undefined,
  expected: boolean,
  field: string,
  format: TournamentFormat,
): void {
  if (value === undefined) {
    return
  }

  if (value !== expected) {
    throw new ValidationError(`${field} is not valid for format ${format}`)
  }
}

function assertUnusedFormatField(
  value: number | null,
  field: string,
  format: TournamentFormat,
): void {
  if (value !== null) {
    throw new ValidationError(`${field} is not used for format ${format}`)
  }
}

function assertFormatSpecificConfig(
  format: TournamentFormat,
  config: TournamentFormatConfig,
  input: TournamentFormatConfigInput,
): void {
  switch (format) {
    case TournamentFormat.ROUND_ROBIN:
    case TournamentFormat.KNOCKOUT_ONLY:
      assertUnusedFormatField(config.playoffQualifiedCount, 'playoffQualifiedCount', format)
      assertUnusedFormatField(config.groupCount, 'groupCount', format)
      assertUnusedFormatField(config.playersPerGroup, 'playersPerGroup', format)
      return
    case TournamentFormat.ROUND_ROBIN_PLAYOFFS:
      config.playoffQualifiedCount = assertRequiredPositiveInteger(
        input.playoffQualifiedCount,
        'playoffQualifiedCount',
        format,
      )
      assertSupportedPlayoffQualifiedCount(config.playoffQualifiedCount)
      assertUnusedFormatField(config.groupCount, 'groupCount', format)
      assertUnusedFormatField(config.playersPerGroup, 'playersPerGroup', format)
      return
    case TournamentFormat.GROUPS_KNOCKOUT:
      config.groupCount = assertRequiredPositiveInteger(input.groupCount, 'groupCount', format)
      assertGroupCountAtLeastTwo(config.groupCount)
      config.playersPerGroup = assertRequiredPositiveInteger(
        input.playersPerGroup,
        'playersPerGroup',
        format,
      )
      config.playoffQualifiedCount = assertRequiredPositiveInteger(
        input.playoffQualifiedCount,
        'playoffQualifiedCount',
        format,
      )
      assertQualifiersPerGroupAtLeastOne(config.playoffQualifiedCount)
      validateGroupsKnockoutBracketTotals(config.groupCount, config.playoffQualifiedCount)
      return
  }
}

export function validateTournamentFormatConfig(
  input: TournamentFormatConfigInput,
): TournamentFormatConfig {
  const format =
    input.format !== undefined
      ? assertTournamentFormat(input.format)
      : TournamentFormat.ROUND_ROBIN
  const defaults = getDefaultConfigForFormat(format)

  const hasGroupStage = assertOptionalBoolean(input.hasGroupStage, 'hasGroupStage')
  const hasPlayoffs = assertOptionalBoolean(input.hasPlayoffs, 'hasPlayoffs')
  const hasKnockoutStage = assertOptionalBoolean(input.hasKnockoutStage, 'hasKnockoutStage')

  assertStageFlagMatchesFormat(hasGroupStage, defaults.hasGroupStage, 'hasGroupStage', format)
  assertStageFlagMatchesFormat(hasPlayoffs, defaults.hasPlayoffs, 'hasPlayoffs', format)
  assertStageFlagMatchesFormat(
    hasKnockoutStage,
    defaults.hasKnockoutStage,
    'hasKnockoutStage',
    format,
  )

  const config: TournamentFormatConfig = {
    format,
    hasGroupStage: defaults.hasGroupStage,
    hasPlayoffs: defaults.hasPlayoffs,
    hasKnockoutStage: defaults.hasKnockoutStage,
    playoffQualifiedCount: parseOptionalPositiveInteger(
      input.playoffQualifiedCount,
      'playoffQualifiedCount',
    ),
    groupCount: parseOptionalPositiveInteger(input.groupCount, 'groupCount'),
    playersPerGroup: parseOptionalPositiveInteger(input.playersPerGroup, 'playersPerGroup'),
  }

  assertFormatSpecificConfig(format, config, input)

  return config
}
