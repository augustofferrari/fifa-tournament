import { useState } from 'react'
import { PageHeader } from '@renderer/components/PageHeader'

const RESET_CONFIRMATION_TEXT = 'DELETE'

export function SettingsPage() {
  const [confirmationText, setConfirmationText] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canReset = confirmationText === RESET_CONFIRMATION_TEXT && !isResetting

  async function handleResetAllData() {
    if (!canReset) {
      return
    }

    setIsResetting(true)
    setErrorMessage(null)

    const result = await window.api.app.resetAllData()

    if (!result.ok) {
      setErrorMessage(result.error.message)
      setIsResetting(false)
      return
    }

    window.location.hash = '#/'
    window.location.reload()
  }

  return (
    <section className="page">
      <PageHeader
        title="Settings"
        description="Configure application preferences."
      />
      <div className="card card--inline">
        <div>
          <h2 className="card__title">Platform</h2>
          <p className="card__meta">{window.api.app.platform}</p>
        </div>
      </div>

      <div className="card settings-danger-zone">
        <h2 className="card__title">Danger zone</h2>
        <p className="card__meta">
          Permanently delete all players, tournaments, matches, stickers, and uploaded photos.
          This cannot be undone.
        </p>

        <label className="field" htmlFor="reset-confirmation">
          <span className="field__label">
            Type <strong>{RESET_CONFIRMATION_TEXT}</strong> to confirm
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
          {isResetting ? 'Resetting…' : 'Delete all data'}
        </button>
      </div>
    </section>
  )
}
