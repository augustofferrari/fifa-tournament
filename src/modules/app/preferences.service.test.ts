import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PreferencesService } from './preferences.service'

describe('PreferencesService', () => {
  let tempDir: string
  let service: PreferencesService

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'mundial-prefs-'))
    service = new PreferencesService()
    service.initialize(tempDir)
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('defaults to Spanish when no preferences file exists', () => {
    expect(service.getLocale()).toBe('es')
  })

  it('persists locale changes to disk', () => {
    service.setLocale('en')

    const persisted = JSON.parse(readFileSync(service.preferencesFilePath, 'utf8')) as {
      locale: string
    }

    expect(persisted.locale).toBe('en')

    const reloaded = new PreferencesService()
    reloaded.initialize(tempDir)
    expect(reloaded.getLocale()).toBe('en')
  })
})
