import en from './locales/en.json'
import es from './locales/es.json'

export type Locale = 'es' | 'en'

export const DEFAULT_LOCALE: Locale = 'es'

export const SUPPORTED_LOCALES: readonly Locale[] = ['es', 'en'] as const

const resources: Record<Locale, Record<string, unknown>> = { en, es }

export function isLocale(value: unknown): value is Locale {
  return value === 'es' || value === 'en'
}

function getNestedValue(source: Record<string, unknown>, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment]
    }

    return undefined
  }, source)

  return typeof value === 'string' ? value : undefined
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = params[key]
    return value === undefined ? `{{${key}}}` : String(value)
  })
}

export function translate(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  params?: Record<string, string | number>,
): string {
  const dictionary = resources[locale] ?? resources[DEFAULT_LOCALE]
  const template = getNestedValue(dictionary, key) ?? getNestedValue(resources.en, key) ?? key

  return interpolate(template, params)
}

export function getLocaleResources(locale: Locale): Record<string, unknown> {
  return resources[locale]
}
