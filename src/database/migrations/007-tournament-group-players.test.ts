import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateTournamentGroupPlayers } from './007-tournament-group-players'
import { createSchemaTables } from './schema'

describe('migration 007 tournament group players', () => {
  let db: Database.Database

  afterEach(() => {
    db?.close()
  })

  it('creates tournament_group_players on a legacy schema', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')

    db.exec(`
      CREATE TABLE players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

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

      CREATE TABLE tournament_groups (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        phase_id TEXT NOT NULL,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (phase_id) REFERENCES tournament_phases(id) ON DELETE CASCADE
      );
    `)

    db.prepare(
      `INSERT INTO players (id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    ).run('p1', 'Alice', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
    db.prepare(
      `INSERT INTO tournaments (id, name, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('t1', 'Cup', 'active', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
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

    expect(() => migrateTournamentGroupPlayers(db)).not.toThrow()

    const indexes = db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'index' AND tbl_name = 'tournament_group_players'
         ORDER BY name`,
      )
      .all() as Array<{ name: string }>

    const indexNames = indexes
      .map((index) => index.name)
      .filter((name) => !name.startsWith('sqlite_autoindex_'))

    expect(indexNames).toEqual(['idx_tournament_group_players_group_player'])

    db.prepare(
      `INSERT INTO tournament_group_players (id, group_id, player_id, seed_position, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('tgp-1', 'group-a', 'p1', 1, '2026-01-01T00:00:00.000Z')

    expect(() =>
      db.prepare(
        `INSERT INTO tournament_group_players (id, group_id, player_id, seed_position, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run('tgp-2', 'group-a', 'p1', 2, '2026-01-01T00:00:00.000Z'),
    ).toThrow()
  })

  it('is safe to run against the current schema', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    expect(() => migrateTournamentGroupPlayers(db)).not.toThrow()
  })
})
