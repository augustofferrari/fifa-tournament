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

export function migrateMatchPhaseSupport(db: BetterSqlite3.Database): void {
  addColumnIfMissing(db, 'matches', 'phase_id', 'TEXT')
  addColumnIfMissing(db, 'matches', 'group_id', 'TEXT')
  addColumnIfMissing(db, 'matches', 'bracket_round', 'TEXT')
  addColumnIfMissing(db, 'matches', 'bracket_position', 'INTEGER')
}
