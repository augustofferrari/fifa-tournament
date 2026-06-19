import type { Migration } from './types'
import { migrateMatchPlayerReferences } from './002-match-player-references'
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

export const migrations: Migration[] = [
  migration001Schema,
  migration002MatchPlayerReferences,
]
