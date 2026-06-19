import { useState } from 'react'
import { PageHeader } from '@renderer/components/PageHeader'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { getErrorMessage } from '@renderer/i18n/ipc-error'
import type { Locale } from '@shared/i18n'

const RESET_CONFIRMATION_TEXT = 'DELETE'

export function SettingsPage() {
  const { t, locale, changeLocale } = useAppTranslation()
  const [confirmationText, setConfirmationText] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [isChangingLocale, setIsChangingLocale] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canReset = confirmationText === RESET_CONFIRMATION_TEXT && !isResetting

  async function handleLocaleChange(nextLocale: Locale) {
    if (nextLocale === locale) {
      return
    }

    setIsChangingLocale(true)
    setErrorMessage(null)

    try {
      await changeLocale(nextLocale)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t))
    } finally {
      setIsChangingLocale(false)
    }
  }

  async function handleResetAllData() {
    if (!canReset) {
      return
    }

    setIsResetting(true)
    setErrorMessage(null)

    try {
      await window.api.app.resetAllData()
      window.location.hash = '#/'
      window.location.reload()
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t))
      setIsResetting(false)
    }
  }

  return (
    <section className="page">
      <PageHeader title={t('settings.title')} description={t('settings.description')} />

      <div className="card card--inline">
        <div>
          <h2 className="card__title">{t('settings.platform')}</h2>
          <p className="card__meta">{window.api.app.platform}</p>
        </div>
      </div>

      <div className="card settings-language">
        <h2 className="card__title">{t('settings.language')}</h2>
        <p className="card__meta">{t('settings.languageDescription')}</p>

        <label className="field" htmlFor="language-select">
          <span className="field__label">{t('settings.language')}</span>
          <select
            id="language-select"
            className="field__input"
            value={locale}
            disabled={isChangingLocale}
            onChange={(event) => void handleLocaleChange(event.target.value as Locale)}
          >
            <option value="es">{t('settings.languageEs')}</option>
            <option value="en">{t('settings.languageEn')}</option>
          </select>
        </label>
      </div>

      <div className="card settings-danger-zone">
        <h2 className="card__title">{t('settings.dangerZone.title')}</h2>
        <p className="card__meta">{t('settings.dangerZone.description')}</p>

        <label className="field" htmlFor="reset-confirmation">
          <span className="field__label">
            {t('settings.dangerZone.confirmLabel', { word: RESET_CONFIRMATION_TEXT })}
          </span>
          <input
            id="reset-confirmation"
            className="field__input"
            type="text"
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={RESET_CONFIRMATION_TEXT}
            autoComplete="off"
            disabled={isResetting}
          />
        </label>

        {errorMessage ? <p className="field__error">{errorMessage}</p> : null}

        <button
          type="button"
          className="btn btn--danger"
          disabled={!canReset}
          onClick={() => void handleResetAllData()}
        >
          {isResetting ? t('common.resetting') : t('settings.dangerZone.deleteAllData')}
        </button>
      </div>
    </section>
  )
}
