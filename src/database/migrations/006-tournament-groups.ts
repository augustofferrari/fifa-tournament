import type BetterSqlite3 from 'better-sqlite3'

export function migrateTournamentGroups(db: BetterSqlite3.Database): void {
  db.exec(`
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
  `)
}
