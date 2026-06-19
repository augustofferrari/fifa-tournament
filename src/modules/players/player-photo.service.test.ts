import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PlayerPhotoService } from './player-photo.service'
import { ValidationError } from './player.validation'

describe('PlayerPhotoService', () => {
  let tempDir: string
  let service: PlayerPhotoService

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'mundial-photos-'))
    service = new PlayerPhotoService()
    service.initialize(tempDir)
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns a data URL for managed photos so the renderer can load them in dev', () => {
    const photoPath = join(tempDir, 'photos', 'player.png')
    writeFileSync(photoPath, Buffer.from([0x89, 0x50, 0x4e, 0x47]))

    const url = service.getPhotoUrl(photoPath)

    expect(url).toMatch(/^data:image\/png;base64,/)
  })

  it('returns null for paths outside the managed photos directory', () => {
    expect(service.getPhotoUrl('/tmp/outside.png')).toBeNull()
  })

  it('copies selected photos into the managed photos directory', () => {
    const sourcePath = join(tempDir, 'source.jpg')
    writeFileSync(sourcePath, Buffer.from('jpeg-data'))

    const savedPath = service.copyPhotoToStorage(sourcePath)

    expect(service.isManagedPhotoPath(savedPath)).toBe(true)
    expect(service.getPhotoUrl(savedPath)).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('rejects unsupported photo extensions', () => {
    const sourcePath = join(tempDir, 'source.gif')
    writeFileSync(sourcePath, Buffer.from('gif-data'))

    expect(() => service.copyPhotoToStorage(sourcePath)).toThrow(ValidationError)
  })
})
