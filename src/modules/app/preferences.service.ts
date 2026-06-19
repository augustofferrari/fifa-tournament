import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@shared/i18n'

const PREFERENCES_FILENAME = 'preferences.json'

export interface AppPreferences {
  locale: Locale
}

const DEFAULT_PREFERENCES: AppPreferences = {
  locale: DEFAULT_LOCALE,
}

export class PreferencesService {
  private userDataPath: string | null = null
  private cached: AppPreferences = { ...DEFAULT_PREFERENCES }

  initialize(userDataPath: string): void {
    this.userDataPath = userDataPath
    this.cached = this.readFromDisk()
  }

  get preferencesFilePath(): string {
    if (!this.userDataPath) {
      throw new Error('PreferencesService has not been initialized.')
    }

    return join(this.userDataPath, PREFERENCES_FILENAME)
  }

  getLocale(): Locale {
    return this.cached.locale
  }

  setLocale(locale: Locale): AppPreferences {
    if (!isLocale(locale)) {
      throw new Error(`Unsupported locale: ${String(locale)}`)
    }

    this.cached = { locale }
    this.writeToDisk(this.cached)
    return this.cached
  }

  private readFromDisk(): AppPreferences {
    const filePath = this.preferencesFilePath

    if (!existsSync(filePath)) {
      this.writeToDisk(DEFAULT_PREFERENCES)
      return { ...DEFAULT_PREFERENCES }
    }

    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<AppPreferences>
      const locale = isLocale(parsed.locale) ? parsed.locale : DEFAULT_LOCALE
      return { locale }
    } catch {
      return { ...DEFAULT_PREFERENCES }
    }
  }

  private writeToDisk(preferences: AppPreferences): void {
    const filePath = this.preferencesFilePath
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, JSON.stringify(preferences, null, 2), 'utf8')
  }
}

export const preferencesService = new PreferencesService()

export function initializePreferencesService(userDataPath: string): void {
  preferencesService.initialize(userDataPath)
}
