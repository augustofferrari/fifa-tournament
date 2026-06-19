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
      format TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
      has_group_stage INTEGER NOT NULL DEFAULT 0,
      has_playoffs INTEGER NOT NULL DEFAULT 0,
      has_knockout_stage INTEGER NOT NULL DEFAULT 0,
      playoff_qualified_count INTEGER,
      group_count INTEGER,
      players_per_group INTEGER,
      points_win INTEGER DEFAULT 3,
      points_draw INTEGER DEFAULT 1,
      points_loss INTEGER DEFAULT 0,
      results_unlocked INTEGER NOT NULL DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS tournament_phases (
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

    CREATE INDEX IF NOT EXISTS idx_tournament_phases_tournament_id
      ON tournament_phases(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_tournament_phases_tournament_order
      ON tournament_phases(tournament_id, order_index);

    CREATE TABLE IF NOT EXISTS tournament_groups (
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

    CREATE INDEX IF NOT EXISTS idx_tournament_groups_tournament_id
      ON tournament_groups(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_tournament_groups_phase_id
      ON tournament_groups(phase_id);

    CREATE TABLE IF NOT EXISTS tournament_group_players (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      seed_position INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES tournament_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_group_players_group_player
      ON tournament_group_players(group_id, player_id);

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      phase_id TEXT,
      group_id TEXT,
      bracket_round TEXT,
      bracket_position INTEGER,
      round_number INTEGER NOT NULL,
      home_player_id TEXT NOT NULL,
      away_player_id TEXT NOT NULL,
      home_goals INTEGER,
      away_goals INTEGER,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (phase_id) REFERENCES tournament_phases(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_matches_phase_id ON matches(phase_id);
    CREATE INDEX IF NOT EXISTS idx_matches_tournament_round
      ON matches(tournament_id, round_number);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_matches_home_player_id ON matches(home_player_id);
    CREATE INDEX IF NOT EXISTS idx_matches_away_player_id ON matches(away_player_id);

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
