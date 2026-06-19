import type BetterSqlite3 from 'better-sqlite3'

export function migrateMatchPlayerReferences(db: BetterSqlite3.Database): void {
  db.exec(`PRAGMA foreign_keys = OFF;`)

  db.exec(`
    CREATE TABLE matches_new (
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
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );

    INSERT INTO matches_new (
      id, tournament_id, round_number, home_player_id, away_player_id,
      home_goals, away_goals, status, created_at, updated_at
    )
    SELECT
      id, tournament_id, round_number, home_player_id, away_player_id,
      home_goals, away_goals, status, created_at, updated_at
    FROM matches;

    DROP TABLE matches;
    ALTER TABLE matches_new RENAME TO matches;

    CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_matches_tournament_round
      ON matches(tournament_id, round_number);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_matches_home_player_id ON matches(home_player_id);
    CREATE INDEX IF NOT EXISTS idx_matches_away_player_id ON matches(away_player_id);
  `)

  db.exec(`PRAGMA foreign_keys = ON;`)
}
