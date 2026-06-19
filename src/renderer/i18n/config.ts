import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LOCALE, getLocaleResources, type Locale } from '@shared/i18n'

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: getLocaleResources('es') },
    en: { translation: getLocaleResources('en') },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n

export async function loadLocale(locale: Locale): Promise<void> {
  await i18n.changeLanguage(locale)
  document.documentElement.lang = locale
}
