import { useState, type FormEvent } from 'react'
import { ApiError } from '@shared/ipc/errors'
import type { Player } from '@shared/types/player'
import { PlayerPhoto } from './PlayerPhoto'

export interface PlayerFormValues {
  name: string
  nickname: string
  teamName: string
  photoPath: string | null
}

interface PlayerFormProps {
  mode: 'create' | 'edit'
  initialValues?: PlayerFormValues
  isSubmitting: boolean
  onSubmit: (values: PlayerFormValues) => Promise<void>
  onCancel: () => void
}

const emptyValues: PlayerFormValues = {
  name: '',
  nickname: '',
  teamName: '',
  photoPath: null,
}

export function PlayerForm({
  mode,
  initialValues = emptyValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: PlayerFormProps) {
  const [values, setValues] = useState<PlayerFormValues>(initialValues)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [isSelectingPhoto, setIsSelectingPhoto] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(values)
  }

  async function handleSelectPhoto() {
    setPhotoError(null)
    setIsSelectingPhoto(true)

    try {
      const photoPath = await window.api.players.selectPhoto()

      if (photoPath) {
        setValues((current) => ({ ...current, photoPath }))
      }
    } catch (error) {
      setPhotoError(error instanceof ApiError ? error.message : 'Failed to select photo')
    } finally {
      setIsSelectingPhoto(false)
    }
  }

  function handleRemovePhoto() {
    setPhotoError(null)
    setValues((current) => ({ ...current, photoPath: null }))
  }

  return (
    <form className="player-form card" onSubmit={handleSubmit}>
      <h2 className="player-form__title">
        {mode === 'create' ? 'Add Player' : 'Edit Player'}
      </h2>

      <div className="player-form__photo">
        <PlayerPhoto photoPath={values.photoPath} alt={values.name || 'Player photo'} size="lg" />
        <div className="player-form__photo-actions">
          <button
            className="btn btn--ghost"
            type="button"
            onClick={handleSelectPhoto}
            disabled={isSubmitting || isSelectingPhoto}
          >
            {isSelectingPhoto ? 'Selecting…' : values.photoPath ? 'Change Photo' : 'Choose Photo'}
          </button>
          {values.photoPath && (
            <button
              className="btn btn--ghost btn--danger"
              type="button"
              onClick={handleRemovePhoto}
              disabled={isSubmitting}
            >
              Remove
            </button>
          )}
        </div>
        {photoError && <p className="field__error">{photoError}</p>}
      </div>

      <label className="field">
        <span className="field__label">Name</span>
        <input
          className="field__input"
          type="text"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          placeholder="Player name"
          required
          autoFocus
        />
      </label>

      <label className="field">
        <span className="field__label">Nickname</span>
        <input
          className="field__input"
          type="text"
          value={values.nickname}
          onChange={(event) => setValues({ ...values, nickname: event.target.value })}
          placeholder="Optional nickname"
        />
      </label>

      <label className="field">
        <span className="field__label">Team</span>
        <input
          className="field__input"
          type="text"
          value={values.teamName}
          onChange={(event) => setValues({ ...values, teamName: event.target.value })}
          placeholder="Optional team name"
        />
      </label>

      <div className="player-form__actions">
        <button className="btn btn--ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button className="btn btn--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Player' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

export function playerToFormValues(player: Player): PlayerFormValues {
  return {
    name: player.name,
    nickname: player.nickname ?? '',
    teamName: player.teamName ?? '',
    photoPath: player.photoPath,
  }
}

export function formValuesToInput(values: PlayerFormValues) {
  return {
    name: values.name,
    nickname: values.nickname || null,
    teamName: values.teamName || null,
    photoPath: values.photoPath,
  }
}
