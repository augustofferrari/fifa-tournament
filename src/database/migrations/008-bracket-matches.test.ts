import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { migrateBracketMatches } from './008-bracket-matches'
import { createSchemaTables } from './schema'

describe('migration 008 bracket matches', () => {
  let db: Database.Database

  afterEach(() => {
    db?.close()
  })

  it('creates bracket_matches on a legacy schema', () => {
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

      CREATE TABLE matches (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL,
        round_number INTEGER NOT NULL,
        home_player_id TEXT NOT NULL,
        away_player_id TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
      );
    `)

    db.prepare(
      `INSERT INTO players (id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    ).run('p1', 'Alice', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
    db.prepare(
      `INSERT INTO players (id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    ).run('p2', 'Bob', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
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
      'KNOCKOUT',
      'Knockout',
      1,
      'active',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    )
    db.prepare(
      `INSERT INTO matches (
        id, tournament_id, round_number, home_player_id, away_player_id,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'm1',
      't1',
      1,
      'p1',
      'p2',
      'scheduled',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    )

    expect(() => migrateBracketMatches(db)).not.toThrow()

    const indexes = db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'index' AND tbl_name = 'bracket_matches'
         ORDER BY name`,
      )
      .all() as Array<{ name: string }>

    const indexNames = indexes
      .map((index) => index.name)
      .filter((name) => !name.startsWith('sqlite_autoindex_'))

    expect(indexNames).toEqual([
      'idx_bracket_matches_match_id',
      'idx_bracket_matches_phase_id',
      'idx_bracket_matches_phase_round_position',
      'idx_bracket_matches_tournament_id',
    ])

    db.prepare(
      `INSERT INTO bracket_matches (
        id, tournament_id, phase_id, match_id, bracket_round, bracket_position,
        home_source_type, home_source_ref, away_source_type, away_source_ref,
        winner_player_id, next_match_id, next_match_slot, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'bm-1',
      't1',
      'phase-1',
      'm1',
      'FINAL',
      1,
      'PLAYER',
      'p1',
      'MATCH_WINNER',
      'bm-qf-1',
      null,
      null,
      null,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    )

    expect(() =>
      db.prepare(
        `INSERT INTO bracket_matches (
          id, tournament_id, phase_id, match_id, bracket_round, bracket_position,
          home_source_type, home_source_ref, away_source_type, away_source_ref,
          winner_player_id, next_match_id, next_match_slot, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        'bm-2',
        't1',
        'phase-1',
        null,
        'FINAL',
        1,
        'GROUP_POSITION',
        'A:1',
        'GROUP_POSITION',
        'B:2',
        null,
        null,
        null,
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z',
      ),
    ).toThrow()

    db.prepare(
      `INSERT INTO bracket_matches (
        id, tournament_id, phase_id, match_id, bracket_round, bracket_position,
        home_source_type, home_source_ref, away_source_type, away_source_ref,
        winner_player_id, next_match_id, next_match_slot, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'bm-sf-1',
      't1',
      'phase-1',
      null,
      'SEMIFINAL',
      1,
      'STANDING_POSITION',
      '1',
      'STANDING_POSITION',
      '4',
      null,
      'bm-1',
      'HOME',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    )

    const semifinal = db
      .prepare(`SELECT next_match_id, next_match_slot FROM bracket_matches WHERE id = ?`)
      .get('bm-sf-1') as { next_match_id: string; next_match_slot: string }

    expect(semifinal).toEqual({
      next_match_id: 'bm-1',
      next_match_slot: 'HOME',
    })

    db.prepare('DELETE FROM matches WHERE id = ?').run('m1')

    const bracketMatch = db
      .prepare(`SELECT match_id FROM bracket_matches WHERE id = ?`)
      .get('bm-1') as { match_id: string | null }

    expect(bracketMatch.match_id).toBeNull()
  })

  it('is safe to run against the current schema', () => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    expect(() => migrateBracketMatches(db)).not.toThrow()
  })
})
