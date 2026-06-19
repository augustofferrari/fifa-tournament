import type { Migration } from './types'
import { migrateMatchPlayerReferences } from './002-match-player-references'
import { migrateTournamentFormatConfiguration } from './003-tournament-format-configuration'
import { migrateTournamentPhases } from './004-tournament-phases'
import { migrateMatchPhaseSupport } from './005-match-phase-support'
import { migrateTournamentGroups } from './006-tournament-groups'
import { migrateTournamentGroupPlayers } from './007-tournament-group-players'
import { migrateBracketMatches } from './008-bracket-matches'
import { migrateTournamentResultsUnlocked } from './009-tournament-results-unlocked'
import { createSchemaTables } from './schema'

export const migration001Schema: Migration = {
  id: 1,
  name: '001_schema',
  up: createSchemaTables,
}

export const migration002MatchPlayerReferences: Migration = {
  id: 2,
  name: '002_match_player_references',
  up: migrateMatchPlayerReferences,
}

export const migration003TournamentFormatConfiguration: Migration = {
  id: 3,
  name: '003_tournament_format_configuration',
  up: migrateTournamentFormatConfiguration,
}

export const migration004TournamentPhases: Migration = {
  id: 4,
  name: '004_tournament_phases',
  up: migrateTournamentPhases,
}

export const migration005MatchPhaseSupport: Migration = {
  id: 5,
  name: '005_match_phase_support',
  up: migrateMatchPhaseSupport,
}

export const migration006TournamentGroups: Migration = {
  id: 6,
  name: '006_tournament_groups',
  up: migrateTournamentGroups,
}

export const migration007TournamentGroupPlayers: Migration = {
  id: 7,
  name: '007_tournament_group_players',
  up: migrateTournamentGroupPlayers,
}

export const migration008BracketMatches: Migration = {
  id: 8,
  name: '008_bracket_matches',
  up: migrateBracketMatches,
}

export const migration009TournamentResultsUnlocked: Migration = {
  id: 9,
  name: '009_tournament_results_unlocked',
  up: migrateTournamentResultsUnlocked,
}

export const migrations: Migration[] = [
  migration001Schema,
  migration002MatchPlayerReferences,
  migration003TournamentFormatConfiguration,
  migration004TournamentPhases,
  migration005MatchPhaseSupport,
  migration006TournamentGroups,
  migration007TournamentGroupPlayers,
  migration008BracketMatches,
  migration009TournamentResultsUnlocked,
]
