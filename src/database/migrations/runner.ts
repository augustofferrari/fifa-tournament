import type BetterSqlite3 from 'better-sqlite3'
import type { Migration } from './types'

const MIGRATIONS_TABLE = '_migrations'

function ensureMigrationsTable(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

function getAppliedMigrationIds(db: BetterSqlite3.Database): Set<number> {
  const rows = db
    .prepare(`SELECT id FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`)
    .all() as Array<{ id: number }>

  return new Set(rows.map((row) => row.id))
}

export function runMigrations(db: BetterSqlite3.Database, migrations: Migration[]): void {
  ensureMigrationsTable(db)

  const appliedIds = getAppliedMigrationIds(db)
  const pending = migrations
    .slice()
    .sort((a, b) => a.id - b.id)
    .filter((migration) => !appliedIds.has(migration.id))

  if (pending.length === 0) {
    return
  }

  const insertMigration = db.prepare(
    `INSERT INTO ${MIGRATIONS_TABLE} (id, name) VALUES (?, ?)`,
  )

  const applyMigration = db.transaction((migration: Migration) => {
    migration.up(db)
    insertMigration.run(migration.id, migration.name)
  })

  for (const migration of pending) {
    applyMigration(migration)
  }
}
