import Database from 'better-sqlite3'
import { getDatabaseFilePath } from './path'
import { migrations } from './migrations'
import { runMigrations } from './migrations/runner'

export class SqliteDatabase {
  private db: Database.Database | null = null

  initialize(userDataPath: string): Database.Database {
    if (this.db) {
      return this.db
    }

    const filePath = getDatabaseFilePath(userDataPath)
    this.db = new Database(filePath)

    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')

    runMigrations(this.db, migrations)

    return this.db
  }

  get connection(): Database.Database {
    if (!this.db) {
      throw new Error('Database has not been initialized.')
    }

    return this.db
  }

  get isInitialized(): boolean {
    return this.db !== null
  }

  close(): void {
    if (!this.db) {
      return
    }

    this.db.close()
    this.db = null
  }
}

export const sqliteDatabase = new SqliteDatabase()

export function initializeDatabase(userDataPath: string): Database.Database {
  return sqliteDatabase.initialize(userDataPath)
}

export function getDatabase(): Database.Database {
  return sqliteDatabase.connection
}

export function closeDatabase(): void {
  sqliteDatabase.close()
}

export { clearAllApplicationData } from './reset-database'
