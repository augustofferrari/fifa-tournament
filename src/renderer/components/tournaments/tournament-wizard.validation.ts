import type { TFunction } from 'i18next'
import {
  getKnockoutOnlyBracketSize,
} from '@shared/tournament/bracket.utils'
import { getTournamentFormatLabel } from '@shared/tournament/format-display.utils'
import type { Locale } from '@shared/i18n'
import {
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

export const WIZARD_STEP_IDS: WizardStepId[] = ['basic', 'players', 'format', 'configure', 'review']

export function getWizardSteps(t: TFunction): WizardStepDefinition[] {
  return WIZARD_STEP_IDS.map((id) => ({
    id,
    label: t(`tournaments.wizard.steps.${id}`),
  }))
}

export const PLAYOFF_QUALIFIER_OPTIONS = ['2', '4', '8', '16'] as const

function derivePlayersPerGroup(playerCount: number, groupCount: number): number {
  return Math.ceil(playerCount / groupCount)
}

function pushValidationError(errors: string[], error: unknown, t: TFunction): void {
  if (error instanceof ValidationError) {
    if (error.i18nKey) {
      errors.push(t(error.i18nKey, error.i18nParams ?? {}))
    } else {
      errors.push(error.message)
    }
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
  t: TFunction,
  locale: Locale,
): string[] {
  const errors: string[] = []

  switch (stepId) {
    case 'basic': {
      if (!state.name.trim()) {
        errors.push(t(ValidationMessages.tournamentNameRequired))
      }
      break
    }
    case 'players': {
      if (state.playerIds.length < 2) {
        errors.push(t(ValidationMessages.tournamentMinPlayers))
      }
      break
    }
    case 'format':
      break
    case 'configure':
      errors.push(...validateWizardFormatConfig(state, t))
      break
    case 'review':
      errors.push(...validateWizardReview(state, t, locale))
      break
  }

  return errors
}

export function validateWizardFormatConfig(state: TournamentWizardState, t: TFunction): string[] {
  const errors: string[] = []

  try {
    const formatConfig = validateTournamentFormatConfig(buildFormatConfigInput(state))
    validateTournamentFormatPlayerRules(formatConfig.format, formatConfig, state.playerIds.length)
  } catch (error) {
    pushValidationError(errors, error, t)
  }

  return errors
}

export function validateWizardReview(
  state: TournamentWizardState,
  t: TFunction,
  locale: Locale,
): string[] {
  const errors: string[] = []

  if (!state.name.trim()) {
    errors.push(t(ValidationMessages.tournamentNameRequired))
  }

  const minimumPlayers = getMinimumPlayersForFormat(state.format)

  if (state.playerIds.length < minimumPlayers) {
    errors.push(
      t('tournaments.wizard.requiresMinPlayers', {
        format: getTournamentFormatLabel(state.format, locale),
        min: minimumPlayers,
      }),
    )
  }

  errors.push(...validateWizardFormatConfig(state, t))

  return [...new Set(errors)]
}

export function getFormatConfigSummary(
  state: TournamentWizardState,
  formatConfig: TournamentFormatConfig,
  t: TFunction,
): string[] {
  const lines: string[] = []

  switch (state.format) {
    case TournamentFormat.ROUND_ROBIN:
      lines.push(t('tournaments.wizard.configSummary.noExtra'))
      break
    case TournamentFormat.ROUND_ROBIN_PLAYOFFS:
      lines.push(
        t('tournaments.wizard.configSummary.playoffQualifiers', {
          count: formatConfig.playoffQualifiedCount,
        }),
      )
      break
    case TournamentFormat.GROUPS_KNOCKOUT:
      lines.push(t('tournaments.wizard.configSummary.groups', { count: formatConfig.groupCount }))
      lines.push(
        t('tournaments.wizard.configSummary.playersPerGroup', {
          perGroup: formatConfig.playersPerGroup,
          selected: state.playerIds.length,
        }),
      )
      lines.push(
        t('tournaments.wizard.configSummary.qualifiersPerGroup', {
          count: formatConfig.playoffQualifiedCount,
        }),
      )
      break
    case TournamentFormat.KNOCKOUT_ONLY: {
      const bracketSize = getKnockoutOnlyBracketSizeLabel(state.playerIds.length)
      lines.push(
        t('tournaments.wizard.configSummary.bracketSize', {
          size: bracketSize ?? t('common.emDash'),
        }),
      )
      if (bracketSize && state.playerIds.length < Number.parseInt(bracketSize, 10)) {
        lines.push(
          t('tournaments.wizard.configSummary.byeSlots', {
            count: Number.parseInt(bracketSize, 10) - state.playerIds.length,
          }),
        )
      }
      break
    }
  }

  return lines
}
