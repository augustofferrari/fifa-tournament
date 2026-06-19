import Database from 'better-sqlite3'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import * as database from '../../database/index'
import { PlayerRepository } from '../players/player.repository'
import { playerPhotoService } from '../players/player-photo.service'
import { stickerExportService } from '../stickers/sticker-export.service'
import { DatabaseResetService } from './database-reset.service'

describe('DatabaseResetService', () => {
  let tempDir: string
  let db: Database.Database
  let service: DatabaseResetService

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'mundial-reset-'))
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    vi.spyOn(database, 'getDatabase').mockReturnValue(db)

    playerPhotoService.initialize(tempDir)
    stickerExportService.initialize(tempDir)
    service = new DatabaseResetService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    db.close()
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('clears database rows and managed photo/sticker files', () => {
    const playerRepository = new PlayerRepository(db)
    playerRepository.createPlayer({ name: 'Alice' })

    const photoPath = join(tempDir, 'photos', 'player.png')
    writeFileSync(photoPath, Buffer.from('png-data'))

    const stickerPath = stickerExportService.savePngFromDataUrl(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    )

    expect(existsSync(photoPath)).toBe(true)
    expect(existsSync(stickerPath)).toBe(true)

    service.resetAllData()

    expect(db.prepare('SELECT COUNT(*) AS count FROM players').get()).toEqual({ count: 0 })
    expect(existsSync(photoPath)).toBe(false)
    expect(existsSync(stickerPath)).toBe(false)
  })
})
