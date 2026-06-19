import { join } from 'node:path'

export const DATABASE_FILENAME = 'mundial.db'

export function getDatabaseFilePath(userDataPath: string): string {
  return join(userDataPath, DATABASE_FILENAME)
}
