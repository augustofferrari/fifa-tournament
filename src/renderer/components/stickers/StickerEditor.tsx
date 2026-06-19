import { useRef, useState } from 'react'
import { ApiError } from '@shared/ipc/errors'
import type { Player } from '@shared/types/player'
import type { Sticker } from '@shared/types/sticker'
import { PlayerPhoto } from '@renderer/components/players/PlayerPhoto'
import { captureStickerPreviewPng } from './capture-sticker-preview'
import { StickerPreview, type StickerPreviewData } from './StickerPreview'

export interface StickerEditorValues {
  playerId: string
  nickname: string
  teamName: string
  rating: string
  position: string
  theme: string
}

export const emptyStickerEditorValues: StickerEditorValues = {
  playerId: '',
  nickname: '',
  teamName: '',
  rating: '',
  position: '',
  theme: 'world-cup',
}

const POSITION_OPTIONS = ['GK', 'DF', 'MF', 'FW', 'ST', 'CM', 'CB', 'LB', 'RB', 'LW', 'RW']

interface StickerEditorProps {
  players: Player[]
  values: StickerEditorValues
  onChange: (values: StickerEditorValues) => void
  onExportSuccess?: (message: string) => void
  onExportError?: (message: string) => void
  lockPlayer?: boolean
  exportButtonLabel?: string
  disabled?: boolean
  className?: string
}

function parseRating(value: string): number | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)

  if (Number.isNaN(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

function buildPreviewData(
  players: Player[],
  values: StickerEditorValues,
): StickerPreviewData {
  const selectedPlayer = players.find((player) => player.id === values.playerId)

  return {
    playerName: selectedPlayer?.name ?? '',
    nickname: values.nickname,
    teamName: values.teamName,
    photoPath: selectedPlayer?.photoPath ?? null,
    rating: parseRating(values.rating),
    position: values.position,
    theme: values.theme,
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Failed to export sticker PNG'
}

export function playerToStickerEditorValues(
  player: Player,
  sticker?: Sticker | null,
): StickerEditorValues {
  return {
    playerId: player.id,
    nickname: player.nickname ?? '',
    teamName: player.teamName ?? '',
    rating: sticker?.rating != null ? String(sticker.rating) : '',
    position: sticker?.position ?? '',
    theme: sticker?.theme ?? 'world-cup',
  }
}

export function StickerEditor({
  players,
  values,
  onChange,
  onExportSuccess,
  onExportError,
  lockPlayer = false,
  exportButtonLabel = 'Export PNG',
  disabled = false,
  className,
}: StickerEditorProps) {
  const previewRef = useRef<HTMLElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const selectedPlayer = players.find((player) => player.id === values.playerId)
  const previewData = buildPreviewData(players, values)
  const canExport = Boolean(values.playerId.trim() && values.theme.trim())

  function updateValues(partial: Partial<StickerEditorValues>) {
    onChange({ ...values, ...partial })
  }

  function handlePlayerChange(playerId: string) {
    const player = players.find((item) => item.id === playerId)

    onChange({
      ...values,
      playerId,
      nickname: player?.nickname ?? '',
      teamName: player?.teamName ?? '',
    })
  }

  async function handleExportPng() {
    if (!previewRef.current || !canExport) {
      return
    }

    setIsExporting(true)

    try {
      const pngDataUrl = await captureStickerPreviewPng(previewRef.current)
      const result = await window.api.stickers.exportPng({
        pngDataUrl,
        playerId: values.playerId,
        theme: values.theme,
        rating: parseRating(values.rating),
        position: values.position.trim() || null,
      })

      onExportSuccess?.(`Sticker PNG exported successfully (${result.generatedImagePath}).`)
    } catch (error) {
      onExportError?.(getErrorMessage(error))
    } finally {
      setIsExporting(false)
    }
  }

  const rootClassName = ['sticker-editor', className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <div className="sticker-editor__form card">
        <h2 className="sticker-editor__title">Sticker Details</h2>

        {!lockPlayer ? (
          <label className="field">
            <span className="field__label">Player</span>
            <select
              className="field__input"
              value={values.playerId}
              onChange={(event) => handlePlayerChange(event.target.value)}
              disabled={disabled || players.length === 0}
            >
              <option value="">Select a player…</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                  {player.teamName ? ` (${player.teamName})` : ''}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {selectedPlayer && (
          <div className="sticker-editor__player-photo">
            <PlayerPhoto
              photoPath={selectedPlayer.photoPath}
              alt={selectedPlayer.name}
              size="lg"
            />
            <div className="sticker-editor__player-meta">
              <div className="sticker-editor__player-name">{selectedPlayer.name}</div>
              {selectedPlayer.teamName && (
                <div className="sticker-editor__player-team">{selectedPlayer.teamName}</div>
              )}
            </div>
          </div>
        )}

        <label className="field">
          <span className="field__label">Nickname</span>
          <input
            className="field__input"
            type="text"
            value={values.nickname}
            onChange={(event) => updateValues({ nickname: event.target.value })}
            placeholder="Sticker display name"
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span className="field__label">Team Name</span>
          <input
            className="field__input"
            type="text"
            value={values.teamName}
            onChange={(event) => updateValues({ teamName: event.target.value })}
            placeholder="National team or club"
            disabled={disabled}
          />
        </label>

        <div className="sticker-editor__row">
          <label className="field sticker-editor__field--half">
            <span className="field__label">Rating</span>
            <input
              className="field__input"
              type="number"
              min={0}
              max={99}
              value={values.rating}
              onChange={(event) => updateValues({ rating: event.target.value })}
              placeholder="OVR"
              disabled={disabled}
            />
          </label>

          <label className="field sticker-editor__field--half">
            <span className="field__label">Position</span>
            <input
              className="field__input"
              type="text"
              list="sticker-position-options"
              value={values.position}
              onChange={(event) => updateValues({ position: event.target.value.toUpperCase() })}
              placeholder="e.g. ST"
              disabled={disabled}
            />
            <datalist id="sticker-position-options">
              {POSITION_OPTIONS.map((position) => (
                <option key={position} value={position} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="field">
          <span className="field__label">Theme</span>
          <input
            className="field__input"
            type="text"
            value={values.theme}
            onChange={(event) => updateValues({ theme: event.target.value })}
            placeholder="world-cup"
            disabled={disabled}
          />
        </label>
      </div>

      <div className="sticker-editor__preview-panel">
        <h2 className="sticker-editor__title">Live Preview</h2>
        <StickerPreview ref={previewRef} data={previewData} />
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => void handleExportPng()}
          disabled={disabled || isExporting || !canExport}
        >
          {isExporting ? 'Exporting…' : exportButtonLabel}
        </button>
      </div>
    </div>
  )
}
