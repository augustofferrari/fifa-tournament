import {
  getKnockoutOnlyBracketSize,
} from '@shared/tournament/bracket.utils'
import {
  TOURNAMENT_FORMAT_OPTIONS,
  TournamentFormat,
  type TournamentFormatConfig,
} from '@shared/types/tournament-format'
import {
  getMinimumPlayersForFormat,
  ValidationError,
  ValidationMessages,
  validateTournamentFormatConfig,
  validateTournamentFormatPlayerRules,
  type TournamentFormatConfigInput,
} from '@shared/validation'

export type WizardStepId = 'basic' | 'players' | 'format' | 'configure' | 'review'

export interface TournamentWizardState {
  name: string
  playerIds: string[]
  format: TournamentFormat
  playoffQualifiedCount: string
  groupCount: string
  qualifiersPerGroup: string
}

export interface WizardStepDefinition {
  id: WizardStepId
  label: string
}

export const WIZARD_STEPS: WizardStepDefinition[] = [
  { id: 'basic', label: 'Basic info' },
  { id: 'players', label: 'Select players' },
  { id: 'format', label: 'Select format' },
  { id: 'configure', label: 'Configure format' },
  { id: 'review', label: 'Review and create' },
]

export const PLAYOFF_QUALIFIER_OPTIONS = ['2', '4', '8', '16'] as const

function derivePlayersPerGroup(playerCount: number, groupCount: number): number {
  return Math.ceil(playerCount / groupCount)
}

function pushValidationError(errors: string[], error: unknown): void {
  if (error instanceof ValidationError) {
    errors.push(error.message)
    return
  }

  if (error instanceof Error) {
    errors.push(error.message)
  }
}

export function getKnockoutOnlyBracketSizeLabel(playerCount: number): string | null {
  try {
    return String(getKnockoutOnlyBracketSize(playerCount))
  } catch {
    return null
  }
}

export function buildFormatConfigInput(state: TournamentWizardState): TournamentFormatConfigInput {
  const playerCount = state.playerIds.length
  const parsedGroupCount = state.groupCount.trim().length > 0 ? Number.parseInt(state.groupCount, 10) : NaN

  switch (state.format) {
    case TournamentFormat.ROUND_ROBIN:
    case TournamentFormat.KNOCKOUT_ONLY:
      return { format: state.format }
    case TournamentFormat.ROUND_ROBIN_PLAYOFFS:
      return {
        format: state.format,
        playoffQualifiedCount: state.playoffQualifiedCount,
      }
    case TournamentFormat.GROUPS_KNOCKOUT:
      return {
        format: state.format,
        groupCount: state.groupCount,
        playoffQualifiedCount: state.qualifiersPerGroup,
        playersPerGroup:
          Number.isInteger(parsedGroupCount) &&
          parsedGroupCount > 0 &&
          playerCount > 0
            ? derivePlayersPerGroup(playerCount, parsedGroupCount)
            : undefined,
      }
  }
}

export function validateWizardStep(
  stepId: WizardStepId,
  state: TournamentWizardState,
): string[] {
  const errors: string[] = []

  switch (stepId) {
    case 'basic': {
      if (!state.name.trim()) {
        errors.push(ValidationMessages.tournamentNameRequired)
      }
      break
    }
    case 'players': {
      if (state.playerIds.length < 2) {
        errors.push(ValidationMessages.tournamentMinPlayers)
      }
      break
    }
    case 'format':
      break
    case 'configure':
      errors.push(...validateWizardFormatConfig(state))
      break
    case 'review':
      errors.push(...validateWizardReview(state))
      break
  }

  return errors
}

export function validateWizardFormatConfig(state: TournamentWizardState): string[] {
  const errors: string[] = []

  try {
    const formatConfig = validateTournamentFormatConfig(buildFormatConfigInput(state))
    validateTournamentFormatPlayerRules(formatConfig.format, formatConfig, state.playerIds.length)
  } catch (error) {
    pushValidationError(errors, error)
  }

  return errors
}

export function validateWizardReview(state: TournamentWizardState): string[] {
  const errors: string[] = []

  if (!state.name.trim()) {
    errors.push(ValidationMessages.tournamentNameRequired)
  }

  const minimumPlayers = getMinimumPlayersForFormat(state.format)

  if (state.playerIds.length < minimumPlayers) {
    errors.push(
      `${getFormatLabel(state.format)} requires at least ${minimumPlayers} players`,
    )
  }

  errors.push(...validateWizardFormatConfig(state))

  return [...new Set(errors)]
}

export function getFormatLabel(format: TournamentFormat): string {
  return TOURNAMENT_FORMAT_OPTIONS.find((option) => option.format === format)?.label ?? format
}

export function getFormatConfigSummary(
  state: TournamentWizardState,
  formatConfig: TournamentFormatConfig,
): string[] {
  const lines: string[] = []

  switch (state.format) {
    case TournamentFormat.ROUND_ROBIN:
      lines.push('No extra configuration')
      break
    case TournamentFormat.ROUND_ROBIN_PLAYOFFS:
      lines.push(`${formatConfig.playoffQualifiedCount} players qualify for playoffs`)
      break
    case TournamentFormat.GROUPS_KNOCKOUT:
      lines.push(`${formatConfig.groupCount} groups`)
      lines.push(`~${formatConfig.playersPerGroup} players per group (from ${state.playerIds.length} selected)`)
      lines.push(`${formatConfig.playoffQualifiedCount} qualifiers per group`)
      break
    case TournamentFormat.KNOCKOUT_ONLY: {
      const bracketSize = getKnockoutOnlyBracketSizeLabel(state.playerIds.length)
      lines.push(`Bracket size: ${bracketSize ?? '—'} (auto-detected)`)
      if (bracketSize && state.playerIds.length < Number.parseInt(bracketSize, 10)) {
        lines.push(`${Number.parseInt(bracketSize, 10) - state.playerIds.length} BYE slot(s) in round 1`)
      }
      break
    }
  }

  return lines
}
