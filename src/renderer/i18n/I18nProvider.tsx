import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { DEFAULT_LOCALE, isLocale, SUPPORTED_LOCALES, type Locale } from '@shared/i18n'
import i18n, { loadLocale } from './config'

interface LocaleContextValue {
  locale: Locale
  changeLocale: (locale: Locale) => Promise<void>
  isReady: boolean
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(i18n.language as Locale)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrapLocale() {
      try {
        const nextLocale = await window.api.app.getLocale()
        const resolvedLocale = isLocale(nextLocale) ? nextLocale : DEFAULT_LOCALE

        if (cancelled) {
          return
        }

        await loadLocale(resolvedLocale)
        setLocale(resolvedLocale)
      } catch {
        if (cancelled) {
          return
        }

        await loadLocale(DEFAULT_LOCALE)
        setLocale(DEFAULT_LOCALE)
      } finally {
        if (!cancelled) {
          setIsReady(true)
        }
      }
    }

    void bootstrapLocale()

    return () => {
      cancelled = true
    }
  }, [])

  const changeLocale = useCallback(async (nextLocale: Locale) => {
    await window.api.app.setLocale(nextLocale)
    await loadLocale(nextLocale)
    setLocale(nextLocale)
  }, [])

  const value = useMemo(
    () => ({
      locale,
      changeLocale,
      isReady,
    }),
    [changeLocale, isReady, locale],
  )

  if (!isReady) {
    return (
      <div className="app-loading">
        <p>{i18n.t('common.loading')}</p>
      </div>
    )
  }

  return (
    <I18nextProvider i18n={i18n}>
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    </I18nextProvider>
  )
}

export function useLocaleContext(): LocaleContextValue {
  const context = useContext(LocaleContext)

  if (!context) {
    throw new Error('useLocaleContext must be used within I18nProvider')
  }

  return context
}

export { SUPPORTED_LOCALES }
