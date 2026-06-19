import type BetterSqlite3 from 'better-sqlite3'

export function migrateTournamentResultsUnlocked(db: BetterSqlite3.Database): void {
  const columns = db
    .prepare(`PRAGMA table_info(tournaments)`)
    .all() as Array<{ name: string }>

  if (columns.some((column) => column.name === 'results_unlocked')) {
    return
  }

  db.exec(`
    ALTER TABLE tournaments
    ADD COLUMN results_unlocked INTEGER NOT NULL DEFAULT 0;
  `)
}
