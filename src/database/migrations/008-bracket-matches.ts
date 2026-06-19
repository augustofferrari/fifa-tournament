import type BetterSqlite3 from 'better-sqlite3'

export function migrateBracketMatches(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bracket_matches (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      phase_id TEXT NOT NULL,
      match_id TEXT,
      bracket_round TEXT NOT NULL,
      bracket_position INTEGER NOT NULL,
      home_source_type TEXT NOT NULL,
      home_source_ref TEXT,
      away_source_type TEXT NOT NULL,
      away_source_ref TEXT,
      winner_player_id TEXT,
      next_match_id TEXT,
      next_match_slot TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (phase_id) REFERENCES tournament_phases(id) ON DELETE CASCADE,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL,
      FOREIGN KEY (winner_player_id) REFERENCES players(id) ON DELETE SET NULL,
      FOREIGN KEY (next_match_id) REFERENCES bracket_matches(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bracket_matches_tournament_id
      ON bracket_matches(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_bracket_matches_phase_id
      ON bracket_matches(phase_id);
    CREATE INDEX IF NOT EXISTS idx_bracket_matches_match_id
      ON bracket_matches(match_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bracket_matches_phase_round_position
      ON bracket_matches(phase_id, bracket_round, bracket_position);
  `)
}
