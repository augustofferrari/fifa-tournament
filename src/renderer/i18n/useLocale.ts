import { useTranslation } from 'react-i18next'
import { SUPPORTED_LOCALES, type Locale } from '@shared/i18n'
import { useLocaleContext } from './I18nProvider'

export function useAppTranslation() {
  const { t, i18n } = useTranslation()
  const { locale, changeLocale, isReady } = useLocaleContext()

  return {
    t,
    i18n,
    locale,
    changeLocale,
    isReady,
  }
}

export function useLocale() {
  return useLocaleContext()
}

export { SUPPORTED_LOCALES, type Locale }
