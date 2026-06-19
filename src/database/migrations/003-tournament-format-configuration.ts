import type BetterSqlite3 from 'better-sqlite3'

interface TableColumnInfo {
  name: string
}

function hasColumn(db: BetterSqlite3.Database, table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as TableColumnInfo[]
  return columns.some((entry) => entry.name === column)
}

function addColumnIfMissing(
  db: BetterSqlite3.Database,
  table: string,
  column: string,
  definition: string,
): void {
  if (!hasColumn(db, table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

export function migrateTournamentFormatConfiguration(db: BetterSqlite3.Database): void {
  addColumnIfMissing(db, 'tournaments', 'format', "TEXT NOT NULL DEFAULT 'ROUND_ROBIN'")
  addColumnIfMissing(db, 'tournaments', 'has_group_stage', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'tournaments', 'has_playoffs', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'tournaments', 'has_knockout_stage', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'tournaments', 'playoff_qualified_count', 'INTEGER')
  addColumnIfMissing(db, 'tournaments', 'group_count', 'INTEGER')
  addColumnIfMissing(db, 'tournaments', 'players_per_group', 'INTEGER')

  db.prepare(
    `UPDATE tournaments
     SET format = 'ROUND_ROBIN'
     WHERE format IS NULL OR TRIM(format) = ''`,
  ).run()

  db.prepare(
    `UPDATE tournaments
     SET has_group_stage = 0,
         has_playoffs = 0,
         has_knockout_stage = 0
     WHERE has_group_stage IS NULL
        OR has_playoffs IS NULL
        OR has_knockout_stage IS NULL`,
  ).run()
}
