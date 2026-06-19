import { translate, type Locale } from '@shared/i18n'

export class ValidationError extends Error {
  readonly i18nKey?: string
  readonly i18nParams?: Record<string, string | number>

  constructor(
    message: string,
    i18nKey?: string,
    i18nParams?: Record<string, string | number>,
  ) {
    super(message)
    this.name = 'ValidationError'
    this.i18nKey = i18nKey
    this.i18nParams = i18nParams
  }
}

export function createValidationError(
  key: string,
  params?: Record<string, string | number>,
  locale: Locale = 'en',
): ValidationError {
  return new ValidationError(translate(key, locale, params), key, params)
}
