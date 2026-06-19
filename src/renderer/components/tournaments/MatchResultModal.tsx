import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '@shared/ipc/errors'
import type { Match } from '@shared/types/match'
import { ValidationMessages, phaseAllowsDraws } from '@shared/validation'
import type { TournamentPhaseType } from '@shared/types/tournament-phase'

interface MatchResultModalProps {
  match: Match | null
  homePlayerName: string
  awayPlayerName: string
  phaseType?: TournamentPhaseType
  isSaving: boolean
  onClose: () => void
  onSave: (homeGoals: number, awayGoals: number) => Promise<void>
}

function parseGoalsInput(value: string): number | null {
  if (value.trim() === '') {
    return null
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

export function MatchResultModal({
  match,
  homePlayerName,
  awayPlayerName,
  phaseType,
  isSaving,
  onClose,
  onSave,
}: MatchResultModalProps) {
  const [homeGoals, setHomeGoals] = useState('')
  const [awayGoals, setAwayGoals] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!match) {
      return
    }

    setHomeGoals(match.homeGoals !== null ? String(match.homeGoals) : '')
    setAwayGoals(match.awayGoals !== null ? String(match.awayGoals) : '')
    setError(null)
  }, [match])

  if (!match) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const parsedHomeGoals = parseGoalsInput(homeGoals)
    const parsedAwayGoals = parseGoalsInput(awayGoals)

    if (parsedHomeGoals === null || parsedAwayGoals === null) {
      setError(ValidationMessages.goalsMustBeWholeNumbers)
      return
    }

    if (phaseType && !phaseAllowsDraws(phaseType) && parsedHomeGoals === parsedAwayGoals) {
      setError(ValidationMessages.knockoutRequiresWinner)
      return
    }

    try {
      await onSave(parsedHomeGoals, parsedAwayGoals)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save match result')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-result-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="match-result-title" className="modal__title">
          {match.status === 'played' ? 'Edit Match Result' : 'Enter Match Result'}
        </h2>

        <form className="match-result-form" onSubmit={handleSubmit}>
          <div className="match-result-form__row">
            <label className="match-result-form__team">
              <span className="match-result-form__team-name">{homePlayerName}</span>
              <input
                className="field__input match-result-form__input"
                type="number"
                min={0}
                step={1}
                value={homeGoals}
                onChange={(event) => setHomeGoals(event.target.value)}
                required
                autoFocus
              />
            </label>

            <span className="match-result-form__divider">–</span>

            <label className="match-result-form__team">
              <span className="match-result-form__team-name">{awayPlayerName}</span>
              <input
                className="field__input match-result-form__input"
                type="number"
                min={0}
                step={1}
                value={awayGoals}
                onChange={(event) => setAwayGoals(event.target.value)}
                required
              />
            </label>
          </div>

          {phaseType && !phaseAllowsDraws(phaseType) && (
            <p className="match-result-form__hint">Knockout matches require a winner.</p>
          )}

          {error && <div className="alert alert--error">{error}</div>}

          <div className="modal__actions">
            <button className="btn btn--ghost" type="button" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button className="btn btn--primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
