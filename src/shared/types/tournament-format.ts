export enum TournamentFormat {
  ROUND_ROBIN = 'ROUND_ROBIN',
  ROUND_ROBIN_PLAYOFFS = 'ROUND_ROBIN_PLAYOFFS',
  GROUPS_KNOCKOUT = 'GROUPS_KNOCKOUT',
  KNOCKOUT_ONLY = 'KNOCKOUT_ONLY',
}

export const TOURNAMENT_FORMATS: TournamentFormat[] = [
  TournamentFormat.ROUND_ROBIN,
  TournamentFormat.ROUND_ROBIN_PLAYOFFS,
  TournamentFormat.GROUPS_KNOCKOUT,
  TournamentFormat.KNOCKOUT_ONLY,
]

export interface TournamentFormatConfig {
  format: TournamentFormat
  hasGroupStage: boolean
  hasPlayoffs: boolean
  hasKnockoutStage: boolean
  playoffQualifiedCount: number | null
  groupCount: number | null
  playersPerGroup: number | null
}

export function getDefaultConfigForFormat(format: TournamentFormat): TournamentFormatConfig {
  switch (format) {
    case TournamentFormat.ROUND_ROBIN:
      return {
        format,
        hasGroupStage: false,
        hasPlayoffs: false,
        hasKnockoutStage: false,
        playoffQualifiedCount: null,
        groupCount: null,
        playersPerGroup: null,
      }
    case TournamentFormat.ROUND_ROBIN_PLAYOFFS:
      return {
        format,
        hasGroupStage: false,
        hasPlayoffs: true,
        hasKnockoutStage: false,
        playoffQualifiedCount: null,
        groupCount: null,
        playersPerGroup: null,
      }
    case TournamentFormat.GROUPS_KNOCKOUT:
      return {
        format,
        hasGroupStage: true,
        hasPlayoffs: false,
        hasKnockoutStage: true,
        playoffQualifiedCount: null,
        groupCount: null,
        playersPerGroup: null,
      }
    case TournamentFormat.KNOCKOUT_ONLY:
      return {
        format,
        hasGroupStage: false,
        hasPlayoffs: false,
        hasKnockoutStage: true,
        playoffQualifiedCount: null,
        groupCount: null,
        playersPerGroup: null,
      }
  }
}

export const DEFAULT_TOURNAMENT_FORMAT = TournamentFormat.ROUND_ROBIN

export const DEFAULT_TOURNAMENT_FORMAT_CONFIG = getDefaultConfigForFormat(
  DEFAULT_TOURNAMENT_FORMAT,
)

export interface TournamentFormatOption {
  format: TournamentFormat
  label: string
  description: string
}

export const TOURNAMENT_FORMAT_OPTIONS: TournamentFormatOption[] = [
  {
    format: TournamentFormat.ROUND_ROBIN,
    label: 'Round Robin only',
    description: 'Every player faces every other player. No playoffs, groups, or knockout.',
  },
  {
    format: TournamentFormat.ROUND_ROBIN_PLAYOFFS,
    label: 'Round Robin + Playoffs',
    description: 'Round robin regular phase, then the top teams advance to playoffs.',
  },
  {
    format: TournamentFormat.GROUPS_KNOCKOUT,
    label: 'Groups + Knockout',
    description: 'Players are split into groups, then top qualifiers advance to a knockout bracket.',
  },
  {
    format: TournamentFormat.KNOCKOUT_ONLY,
    label: 'Knockout only',
    description: 'Players go directly into a single-elimination bracket.',
  },
]

export function getTournamentFormatLabel(format: TournamentFormat): string {
  return TOURNAMENT_FORMAT_OPTIONS.find((option) => option.format === format)?.label ?? format
}
