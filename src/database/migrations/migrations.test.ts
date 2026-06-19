import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { migrations } from './index'
import { runMigrations } from './runner'

describe('database migrations', () => {
  let db: Database.Database

  afterEach(() => {
    db?.close()
  })

  it('applies all migrations on a fresh database', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')

    expect(() => runMigrations(db, migrations)).not.toThrow()

    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
      .all() as Array<{ name: string }>

    expect(tables.map((table) => table.name)).toContain('matches')
    expect(tables.map((table) => table.name)).toContain('_migrations')

    const applied = db
      .prepare(`SELECT id FROM _migrations ORDER BY id`)
      .all() as Array<{ id: number }>

    expect(applied.map((row) => row.id)).toEqual([1, 2])
  })

  it('allows deleting players referenced by matches after migration 002', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    runMigrations(db, migrations)

    db.prepare(
      `INSERT INTO players (id, name, nickname, team_name, photo_path, created_at, updated_at)
       VALUES (?, ?, NULL, NULL, NULL, ?, ?)`,
    ).run('p1', 'Alice', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
    db.prepare(
      `INSERT INTO players (id, name, nickname, team_name, photo_path, created_at, updated_at)
       VALUES (?, ?, NULL, NULL, NULL, ?, ?)`,
    ).run('p2', 'Bob', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
    db.prepare(
      `INSERT INTO tournaments (id, name, status, points_win, points_draw, points_loss, created_at, updated_at)
       VALUES (?, ?, ?, 3, 1, 0, ?, ?)`,
    ).run('t1', 'Cup', 'active', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
    db.prepare(`INSERT INTO matches (
      id, tournament_id, round_number, home_player_id, away_player_id,
      home_goals, away_goals, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'm1',
      't1',
      1,
      'p1',
      'p2',
      null,
      null,
      'scheduled',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    )

    expect(() => db.prepare('DELETE FROM players WHERE id = ?').run('p1')).not.toThrow()

    const match = db.prepare('SELECT home_player_id FROM matches WHERE id = ?').get('m1') as {
      home_player_id: string
    }

    expect(match.home_player_id).toBe('p1')
  })
})
