import type BetterSqlite3 from 'better-sqlite3'

export function migrateTournamentPhases(db: BetterSqlite3.Database): void {
  db.exec(`
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
  `)
}
