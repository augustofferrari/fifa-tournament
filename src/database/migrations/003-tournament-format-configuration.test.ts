import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateTournamentFormatConfiguration } from './003-tournament-format-configuration'
import { createSchemaTables } from './schema'

describe('migration 003 from legacy schema', () => {
  let db: Database.Database

  afterEach(() => {
    db?.close()
  })

  it('adds format configuration columns to legacy tournaments', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')

    db.exec(`
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
    `)

    db.prepare(
      `INSERT INTO tournaments (id, name, status, points_win, points_draw, points_loss, created_at, updated_at)
       VALUES (?, ?, ?, 3, 1, 0, ?, ?)`,
    ).run('t1', 'Legacy Cup', 'active', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')

    expect(() => migrateTournamentFormatConfiguration(db)).not.toThrow()

    const tournament = db
      .prepare(
        `SELECT format, has_group_stage, has_playoffs, has_knockout_stage,
                playoff_qualified_count, group_count, players_per_group
         FROM tournaments
         WHERE id = 't1'`,
      )
      .get() as {
      format: string
      has_group_stage: number
      has_playoffs: number
      has_knockout_stage: number
      playoff_qualified_count: number | null
      group_count: number | null
      players_per_group: number | null
    }

    expect(tournament.format).toBe('ROUND_ROBIN')
    expect(tournament.has_group_stage).toBe(0)
    expect(tournament.has_playoffs).toBe(0)
    expect(tournament.has_knockout_stage).toBe(0)
    expect(tournament.playoff_qualified_count).toBeNull()
    expect(tournament.group_count).toBeNull()
    expect(tournament.players_per_group).toBeNull()
  })

  it('is safe to run against the current schema', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    expect(() => migrateTournamentFormatConfiguration(db)).not.toThrow()
  })
})
