import { useMemo, useState, type FormEvent } from 'react'
import type { Player } from '@shared/types/player'
import type { CreateTournamentInput } from '@shared/types/tournament'
import {
  DEFAULT_TOURNAMENT_FORMAT,
  TOURNAMENT_FORMAT_OPTIONS,
  TournamentFormat,
} from '@shared/types/tournament-format'
import { MIN_TOURNAMENT_PLAYERS, ValidationError, ValidationMessages } from '@shared/validation'
import { validateTournamentFormatConfig } from '@shared/validation/tournament-format'
import { PlayerSelector } from './PlayerSelector'

export interface TournamentCreateFormValues {
  name: string
  format: TournamentFormat
  playoffQualifiedCount: string
  groupCount: string
  playersPerGroup: string
  playerIds: string[]
}

interface TournamentCreateFormProps {
  players: Player[]
  isSubmitting: boolean
  onSubmit: (input: CreateTournamentInput, playerIds: string[]) => Promise<void>
  onCancel: () => void
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

export function TournamentCreateForm({
  players,
  isSubmitting,
  onSubmit,
  onCancel,
}: TournamentCreateFormProps) {
  const [name, setName] = useState('')
  const [format, setFormat] = useState<TournamentFormat>(DEFAULT_TOURNAMENT_FORMAT)
  const [playoffQualifiedCount, setPlayoffQualifiedCount] = useState('')
  const [groupCount, setGroupCount] = useState('')
  const [playersPerGroup, setPlayersPerGroup] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  const selectedFormatOption = useMemo(
    () => TOURNAMENT_FORMAT_OPTIONS.find((option) => option.format === format),
    [format],
  )

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

    try {
      const formatConfig = validateTournamentFormatConfig({
        format,
        playoffQualifiedCount,
        groupCount,
        playersPerGroup,
      })

      await onSubmit(
        {
          name: trimmedName,
          format: formatConfig.format,
          playoffQualifiedCount: formatConfig.playoffQualifiedCount,
          groupCount: formatConfig.groupCount,
          playersPerGroup: formatConfig.playersPerGroup,
        },
        selectedPlayerIds,
      )
    } catch (error) {
      setValidationError(getErrorMessage(error))
    }
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

      <fieldset className="tournament-form__format-fieldset">
        <legend className="field__label">Tournament Format</legend>
        <div className="tournament-form__format-options">
          {TOURNAMENT_FORMAT_OPTIONS.map((option) => (
            <label key={option.format} className="tournament-form__format-option">
              <input
                type="radio"
                name="tournament-format"
                value={option.format}
                checked={format === option.format}
                onChange={() => setFormat(option.format)}
                disabled={isSubmitting}
              />
              <span className="tournament-form__format-copy">
                <span className="tournament-form__format-label">{option.label}</span>
                <span className="tournament-form__format-description">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {selectedFormatOption && (
        <p className="tournament-form__format-summary">{selectedFormatOption.description}</p>
      )}

      {format === TournamentFormat.ROUND_ROBIN_PLAYOFFS && (
        <label className="field">
          <span className="field__label">Teams qualifying for playoffs</span>
          <input
            className="field__input"
            type="number"
            min={1}
            step={1}
            value={playoffQualifiedCount}
            onChange={(event) => setPlayoffQualifiedCount(event.target.value)}
            placeholder="e.g. 4"
            required
            disabled={isSubmitting}
          />
        </label>
      )}

      {format === TournamentFormat.GROUPS_KNOCKOUT && (
        <>
          <label className="field">
            <span className="field__label">Number of groups</span>
            <input
              className="field__input"
              type="number"
              min={1}
              step={1}
              value={groupCount}
              onChange={(event) => setGroupCount(event.target.value)}
              placeholder="e.g. 4"
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="field">
            <span className="field__label">Players per group</span>
            <input
              className="field__input"
              type="number"
              min={1}
              step={1}
              value={playersPerGroup}
              onChange={(event) => setPlayersPerGroup(event.target.value)}
              placeholder="e.g. 4"
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="field">
            <span className="field__label">Qualifiers per group</span>
            <input
              className="field__input"
              type="number"
              min={1}
              step={1}
              value={playoffQualifiedCount}
              onChange={(event) => setPlayoffQualifiedCount(event.target.value)}
              placeholder="e.g. 2"
              required
              disabled={isSubmitting}
            />
          </label>
        </>
      )}

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
