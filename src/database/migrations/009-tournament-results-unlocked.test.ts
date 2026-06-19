import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from './schema'
import { migrateTournamentResultsUnlocked } from './009-tournament-results-unlocked'

describe('migration 009 tournament results unlocked', () => {
  let db: Database.Database

  afterEach(() => {
    db?.close()
  })

  it('adds results_unlocked to legacy tournaments', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    db.prepare(
      `INSERT INTO tournaments (
        id, name, status, format, has_group_stage, has_playoffs, has_knockout_stage,
        playoff_qualified_count, group_count, players_per_group,
        points_win, points_draw, points_loss, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 0, 0, 0, NULL, NULL, NULL, 3, 1, 0, ?, ?)`,
    ).run(
      't1',
      'Legacy Cup',
      'finished',
      'ROUND_ROBIN',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    )

    migrateTournamentResultsUnlocked(db)

    const tournament = db
      .prepare(`SELECT results_unlocked FROM tournaments WHERE id = ?`)
      .get('t1') as { results_unlocked: number }

    expect(tournament.results_unlocked).toBe(0)
  })
})
