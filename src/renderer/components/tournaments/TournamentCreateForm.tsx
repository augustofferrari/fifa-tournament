import { useMemo, useState, type FormEvent } from 'react'
import type { Player } from '@shared/types/player'
import type { CreateTournamentInput } from '@shared/types/tournament'
import { getTournamentFormatOptions } from '@shared/tournament/format-display.utils'
import {
  DEFAULT_TOURNAMENT_FORMAT,
  TournamentFormat,
} from '@shared/types/tournament-format'
import { MIN_TOURNAMENT_PLAYERS, ValidationMessages } from '@shared/validation'
import { validateTournamentFormatConfig } from '@shared/validation/tournament-format'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { getErrorMessage } from '@renderer/i18n/ipc-error'
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

export function TournamentCreateForm({
  players,
  isSubmitting,
  onSubmit,
  onCancel,
}: TournamentCreateFormProps) {
  const { t, locale } = useAppTranslation()
  const [name, setName] = useState('')
  const [format, setFormat] = useState<TournamentFormat>(DEFAULT_TOURNAMENT_FORMAT)
  const [playoffQualifiedCount, setPlayoffQualifiedCount] = useState('')
  const [groupCount, setGroupCount] = useState('')
  const [playersPerGroup, setPlayersPerGroup] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  const formatOptions = useMemo(() => getTournamentFormatOptions(locale), [locale])

  const selectedFormatOption = useMemo(
    () => formatOptions.find((option) => option.format === format),
    [format, formatOptions],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    const trimmedName = name.trim()

    if (!trimmedName) {
      setValidationError(t(ValidationMessages.tournamentNameRequired))
      return
    }

    if (selectedPlayerIds.length < MIN_TOURNAMENT_PLAYERS) {
      setValidationError(t(ValidationMessages.tournamentMinPlayers))
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
      setValidationError(getErrorMessage(error, t))
    }
  }

  return (
    <form className="tournament-form card" onSubmit={handleSubmit}>
      <h2 className="tournament-form__title">{t('tournaments.createForm.title')}</h2>

      <label className="field">
        <span className="field__label">{t('tournaments.createForm.tournamentName')}</span>
        <input
          className="field__input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('tournaments.createForm.namePlaceholder')}
          required
          autoFocus
        />
      </label>

      <fieldset className="tournament-form__format-fieldset">
        <legend className="field__label">{t('tournaments.createForm.formatLegend')}</legend>
        <div className="tournament-form__format-options">
          {formatOptions.map((option) => (
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
          <span className="field__label">{t('tournaments.createForm.teamsQualifyingPlayoffs')}</span>
          <input
            className="field__input"
            type="number"
            min={1}
            step={1}
            value={playoffQualifiedCount}
            onChange={(event) => setPlayoffQualifiedCount(event.target.value)}
            placeholder={t('tournaments.createForm.examplePlaceholder', { value: 4 })}
            required
            disabled={isSubmitting}
          />
        </label>
      )}

      {format === TournamentFormat.GROUPS_KNOCKOUT && (
        <>
          <label className="field">
            <span className="field__label">{t('tournaments.createForm.numberOfGroups')}</span>
            <input
              className="field__input"
              type="number"
              min={1}
              step={1}
              value={groupCount}
              onChange={(event) => setGroupCount(event.target.value)}
              placeholder={t('tournaments.createForm.examplePlaceholder', { value: 4 })}
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="field">
            <span className="field__label">{t('tournaments.createForm.playersPerGroup')}</span>
            <input
              className="field__input"
              type="number"
              min={1}
              step={1}
              value={playersPerGroup}
              onChange={(event) => setPlayersPerGroup(event.target.value)}
              placeholder={t('tournaments.createForm.examplePlaceholder', { value: 4 })}
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="field">
            <span className="field__label">{t('tournaments.createForm.qualifiersPerGroup')}</span>
            <input
              className="field__input"
              type="number"
              min={1}
              step={1}
              value={playoffQualifiedCount}
              onChange={(event) => setPlayoffQualifiedCount(event.target.value)}
              placeholder={t('tournaments.createForm.examplePlaceholder', { value: 2 })}
              required
              disabled={isSubmitting}
            />
          </label>
        </>
      )}

      <div className="field">
        <span className="field__label">
          {t('tournaments.createForm.playersLabel', {
            selected: selectedPlayerIds.length,
            min: MIN_TOURNAMENT_PLAYERS,
          })}
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
          {t('common.cancel')}
        </button>
        <button className="btn btn--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.creating') : t('tournaments.createTournament')}
        </button>
      </div>
    </form>
  )
}
