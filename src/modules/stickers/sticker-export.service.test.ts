import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StickerExportService } from './sticker-export.service'
import { ValidationError } from './sticker.validation'

describe('StickerExportService', () => {
  let tempDir: string
  let service: StickerExportService

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'mundial-stickers-'))
    service = new StickerExportService()
    service.initialize(tempDir)
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('saves a PNG from a data URL to the stickers folder', () => {
    const pngDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

    const savedPath = service.savePngFromDataUrl(pngDataUrl)

    expect(service.isManagedStickerPath(savedPath)).toBe(true)
    expect(readFileSync(savedPath).length).toBeGreaterThan(0)
  })

  it('rejects invalid data URLs', () => {
    expect(() => service.savePngFromDataUrl('not-a-data-url')).toThrow(ValidationError)
  })

  it('returns a file URL for managed sticker images', () => {
    const savedPath = service.savePngFromDataUrl(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    )

    expect(service.getImageUrl(savedPath)).toMatch(/^file:\/\//)
    expect(service.getImageUrl('/tmp/outside.png')).toBeNull()
  })
})
