import type BetterSqlite3 from 'better-sqlite3'

export function createSchemaTables(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nickname TEXT,
      team_name TEXT,
      photo_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
    CREATE INDEX IF NOT EXISTS idx_players_team_name ON players(team_name);

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      points_win INTEGER DEFAULT 3,
      points_draw INTEGER DEFAULT 1,
      points_loss INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);

    CREATE TABLE IF NOT EXISTS tournament_players (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_players_tournament_player
      ON tournament_players(tournament_id, player_id);
    CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament_id
      ON tournament_players(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_tournament_players_player_id
      ON tournament_players(player_id);

    CREATE TABLE IF NOT EXISTS matches (
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

    CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_matches_tournament_round
      ON matches(tournament_id, round_number);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_matches_home_player_id ON matches(home_player_id);
    CREATE INDEX IF NOT EXISTS idx_matches_away_player_id ON matches(away_player_id);

    CREATE TABLE IF NOT EXISTS stickers (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      theme TEXT NOT NULL,
      generated_image_path TEXT,
      rating INTEGER,
      position TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_stickers_player_id ON stickers(player_id);
    CREATE INDEX IF NOT EXISTS idx_stickers_player_theme ON stickers(player_id, theme);
  `)
}
