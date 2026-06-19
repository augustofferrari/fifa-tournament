import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateTournamentGroups } from './006-tournament-groups'
import { createSchemaTables } from './schema'

describe('migration 006 tournament groups', () => {
  let db: Database.Database

  afterEach(() => {
    db?.close()
  })

  it('creates tournament_groups on a legacy schema', () => {
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

      CREATE TABLE tournament_phases (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        phase_type TEXT NOT NULL,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
      );
    `)

    db.prepare(
      `INSERT INTO tournaments (id, name, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('t1', 'Summer Cup', 'active', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
    db.prepare(
      `INSERT INTO tournament_phases (
        id, tournament_id, phase_type, name, order_index, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'phase-1',
      't1',
      'GROUP_STAGE',
      'Group Stage',
      1,
      'active',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    )

    expect(() => migrateTournamentGroups(db)).not.toThrow()

    const indexes = db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'index' AND tbl_name = 'tournament_groups'
         ORDER BY name`,
      )
      .all() as Array<{ name: string }>

    const indexNames = indexes
      .map((index) => index.name)
      .filter((name) => !name.startsWith('sqlite_autoindex_'))

    expect(indexNames).toEqual([
      'idx_tournament_groups_phase_id',
      'idx_tournament_groups_tournament_id',
    ])

    db.prepare(
      `INSERT INTO tournament_groups (
        id, tournament_id, phase_id, name, order_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'group-a',
      't1',
      'phase-1',
      'Group A',
      1,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    )

    const group = db
      .prepare(`SELECT name, order_index FROM tournament_groups WHERE id = ?`)
      .get('group-a') as { name: string; order_index: number }

    expect(group).toEqual({ name: 'Group A', order_index: 1 })
  })

  it('is safe to run against the current schema', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    expect(() => migrateTournamentGroups(db)).not.toThrow()
  })
})
