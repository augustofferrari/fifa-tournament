import { translate, type Locale } from '@shared/i18n'
import { TournamentFormat } from '@shared/types/tournament-format'

const FORMAT_LABEL_KEYS: Record<TournamentFormat, string> = {
  [TournamentFormat.ROUND_ROBIN]: 'tournaments.format.roundRobinOnly',
  [TournamentFormat.ROUND_ROBIN_PLAYOFFS]: 'tournaments.format.roundRobinPlayoffs',
  [TournamentFormat.GROUPS_KNOCKOUT]: 'tournaments.format.groupsKnockout',
  [TournamentFormat.KNOCKOUT_ONLY]: 'tournaments.format.knockoutOnly',
}

const FORMAT_DESCRIPTION_KEYS: Record<TournamentFormat, string> = {
  [TournamentFormat.ROUND_ROBIN]: 'tournaments.format.roundRobinOnlyDesc',
  [TournamentFormat.ROUND_ROBIN_PLAYOFFS]: 'tournaments.format.roundRobinPlayoffsDesc',
  [TournamentFormat.GROUPS_KNOCKOUT]: 'tournaments.format.groupsKnockoutDesc',
  [TournamentFormat.KNOCKOUT_ONLY]: 'tournaments.format.knockoutOnlyDesc',
}

export interface LocalizedTournamentFormatOption {
  format: TournamentFormat
  label: string
  description: string
}

export function getTournamentFormatOptions(locale: Locale = 'es'): LocalizedTournamentFormatOption[] {
  return Object.values(TournamentFormat).map((format) => ({
    format,
    label: translate(FORMAT_LABEL_KEYS[format], locale),
    description: translate(FORMAT_DESCRIPTION_KEYS[format], locale),
  }))
}

export function getTournamentFormatLabel(format: TournamentFormat, locale: Locale = 'es'): string {
  return translate(FORMAT_LABEL_KEYS[format], locale)
}
