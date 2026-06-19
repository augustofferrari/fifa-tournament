import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateTournamentPhases } from './004-tournament-phases'
import { createSchemaTables } from './schema'

describe('migration 004 tournament phases', () => {
  let db: Database.Database

  afterEach(() => {
    db?.close()
  })

  it('creates tournament_phases on a legacy schema', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')

    db.exec(`
      CREATE TABLE tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)

    expect(() => migrateTournamentPhases(db)).not.toThrow()

    const table = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tournament_phases'`,
      )
      .get() as { name: string } | undefined

    expect(table?.name).toBe('tournament_phases')

    const indexes = db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'index' AND tbl_name = 'tournament_phases'
         ORDER BY name`,
      )
      .all() as Array<{ name: string }>

    const indexNames = indexes
      .map((index) => index.name)
      .filter((name) => !name.startsWith('sqlite_autoindex_'))

    expect(indexNames).toEqual([
      'idx_tournament_phases_tournament_id',
      'idx_tournament_phases_tournament_order',
    ])
  })

  it('supports inserting phases for a tournament', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    db.prepare(
      `INSERT INTO tournaments (id, name, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('t1', 'Summer Cup', 'draft', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')

    db.prepare(
      `INSERT INTO tournament_phases (
        id, tournament_id, phase_type, name, order_index, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'phase-1',
      't1',
      'ROUND_ROBIN',
      'Regular Season',
      1,
      'pending',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    )

    const phase = db
      .prepare(`SELECT phase_type, status, order_index FROM tournament_phases WHERE id = ?`)
      .get('phase-1') as { phase_type: string; status: string; order_index: number }

    expect(phase).toEqual({
      phase_type: 'ROUND_ROBIN',
      status: 'pending',
      order_index: 1,
    })
  })

  it('is safe to run against the current schema', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    expect(() => migrateTournamentPhases(db)).not.toThrow()
  })
})
