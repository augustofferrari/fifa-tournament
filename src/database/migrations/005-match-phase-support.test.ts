import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateMatchPhaseSupport } from './005-match-phase-support'
import { createSchemaTables } from './schema'

describe('migration 005 match phase support', () => {
  let db: Database.Database

  afterEach(() => {
    db?.close()
  })

  it('adds phase columns to legacy matches table', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')

    db.exec(`
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
        updated_at TEXT NOT NULL
      );
    `)

    db.prepare(
      `INSERT INTO matches (
        id, tournament_id, round_number, home_player_id, away_player_id,
        home_goals, away_goals, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'm1',
      't1',
      1,
      'p1',
      'p2',
      2,
      1,
      'played',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    )

    expect(() => migrateMatchPhaseSupport(db)).not.toThrow()

    const match = db
      .prepare(
        `SELECT phase_id, group_id, bracket_round, bracket_position
         FROM matches
         WHERE id = 'm1'`,
      )
      .get() as {
      phase_id: string | null
      group_id: string | null
      bracket_round: string | null
      bracket_position: number | null
    }

    expect(match.phase_id).toBeNull()
    expect(match.group_id).toBeNull()
    expect(match.bracket_round).toBeNull()
    expect(match.bracket_position).toBeNull()
  })

  it('is safe to run against the current schema', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    expect(() => migrateMatchPhaseSupport(db)).not.toThrow()
  })
})
