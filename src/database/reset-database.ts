import type Database from 'better-sqlite3'

const APPLICATION_DATA_TABLES = [
  'stickers',
  'bracket_matches',
  'matches',
  'tournament_group_players',
  'tournament_groups',
  'tournament_players',
  'tournament_phases',
  'tournaments',
  'players',
] as const

export function clearAllApplicationData(db: Database.Database): void {
  const clearTables = db.transaction(() => {
    db.pragma('foreign_keys = OFF')

    for (const table of APPLICATION_DATA_TABLES) {
      db.exec(`DELETE FROM ${table}`)
    }

    db.pragma('foreign_keys = ON')
  })

  clearTables()
}
