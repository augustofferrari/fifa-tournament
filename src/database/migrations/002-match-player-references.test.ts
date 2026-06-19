import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateMatchPlayerReferences } from './002-match-player-references'
import { createSchemaTables } from './schema'

describe('migration 002 from legacy schema', () => {
  let db: Database.Database

  afterEach(() => {
    db?.close()
  })

  it('migrates databases created before player FK removal', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')

    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        nickname TEXT,
        team_name TEXT,
        photo_path TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        points_win INTEGER DEFAULT 3,
        points_draw INTEGER DEFAULT 1,
        points_loss INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE matches (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        round_number INTEGER NOT NULL,
        home_player_id TEXT NOT NULL,
        away_player_id TEXT NOT NULL,
        home_goals INTEGER,
        away_goals INTEGER,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (home_player_id) REFERENCES players(id),
        FOREIGN KEY (away_player_id) REFERENCES players(id)
      );
    `)

    db.prepare(`INSERT INTO _migrations (id, name) VALUES (?, ?)`).run(1, '001_schema')

    expect(() => migrateMatchPlayerReferences(db)).not.toThrow()

    db.prepare(
      `INSERT INTO players (id, name, created_at, updated_at) VALUES ('p1', 'Alice', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
    ).run()
    db.prepare(
      `INSERT INTO players (id, name, created_at, updated_at) VALUES ('p2', 'Bob', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
    ).run()
    db.prepare(
      `INSERT INTO tournaments (id, name, status, created_at, updated_at)
       VALUES ('t1', 'Cup', 'active', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
    ).run()
    db.prepare(`INSERT INTO matches (
      id, tournament_id, round_number, home_player_id, away_player_id,
      home_goals, away_goals, status, created_at, updated_at
    ) VALUES ('m1', 't1', 1, 'p1', 'p2', NULL, NULL, 'scheduled', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`).run()

    expect(() => db.prepare(`DELETE FROM players WHERE id = 'p1'`).run()).not.toThrow()
  })

  it('is safe to run against the current schema', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    expect(() => migrateMatchPlayerReferences(db)).not.toThrow()
  })
})
