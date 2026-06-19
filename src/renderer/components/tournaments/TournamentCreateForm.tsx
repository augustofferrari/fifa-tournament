import { useState, type FormEvent } from 'react'
import type { Player } from '@shared/types/player'
import { MIN_TOURNAMENT_PLAYERS, ValidationMessages } from '@shared/validation'
import { PlayerSelector } from './PlayerSelector'

interface TournamentCreateFormProps {
  players: Player[]
  isSubmitting: boolean
  onSubmit: (name: string, playerIds: string[]) => Promise<void>
  onCancel: () => void
}

export function TournamentCreateForm({
  players,
  isSubmitting,
  onSubmit,
  onCancel,
}: TournamentCreateFormProps) {
  const [name, setName] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    const trimmedName = name.trim()

    if (!trimmedName) {
      setValidationError(ValidationMessages.tournamentNameRequired)
      return
    }

    if (selectedPlayerIds.length < MIN_TOURNAMENT_PLAYERS) {
      setValidationError(ValidationMessages.tournamentMinPlayers)
      return
    }

    await onSubmit(trimmedName, selectedPlayerIds)
  }

  return (
    <form className="tournament-form card" onSubmit={handleSubmit}>
      <h2 className="tournament-form__title">Create Tournament</h2>

      <label className="field">
        <span className="field__label">Tournament Name</span>
        <input
          className="field__input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter tournament name"
          required
          autoFocus
        />
      </label>

      <div className="field">
        <span className="field__label">
          Players ({selectedPlayerIds.length} selected, minimum {MIN_TOURNAMENT_PLAYERS})
        </span>
        <PlayerSelector
          players={players}
          selectedIds={selectedPlayerIds}
          onChange={setSelectedPlayerIds}
          disabled={isSubmitting}
        />
      </div>

      {validationError && <div className="alert alert--error">{validationError}</div>}

      <div className="tournament-form__actions">
        <button className="btn btn--ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button className="btn btn--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create Tournament'}
        </button>
      </div>
    </form>
  )
}
