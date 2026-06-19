import type BetterSqlite3 from 'better-sqlite3'

export function migrateTournamentGroupPlayers(db: BetterSqlite3.Database): void {
  db.exec(`
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
  `)
}
