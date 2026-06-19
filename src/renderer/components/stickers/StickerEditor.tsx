import { useEffect, useRef, useState } from 'react'
import type { Player } from '@shared/types/player'
import type { Sticker } from '@shared/types/sticker'
import { StickerTier, type PlayerStickerTierInfo } from '@shared/types/sticker-tier'
import { PlayerPhoto } from '@renderer/components/players/PlayerPhoto'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { getErrorMessage } from '@renderer/i18n/ipc-error'
import { captureStickerPreviewPng } from './capture-sticker-preview'
import { StickerPreview, type StickerPreviewData } from './StickerPreview'
import { StickerTierBadge } from './StickerTierBadge'
import { formatStickerWinRate } from './sticker-stats-utils'

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

const EMPTY_TIER_INFO: PlayerStickerTierInfo = {
  playerId: '',
  tier: StickerTier.BRONZE,
  historicalRank: null,
  tournamentsWon: 0,
  goalsFor: 0,
  winRate: 0,
}

interface StickerEditorProps {
  players: Player[]
  values: StickerEditorValues
  playerTierInfo?: PlayerStickerTierInfo
  onChange: (values: StickerEditorValues) => void
  onExportSuccess?: (message: string, sticker: Sticker) => void
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
  playerTierInfo: PlayerStickerTierInfo,
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
    tier: playerTierInfo.tier,
    stats: {
      tournamentsWon: playerTierInfo.tournamentsWon,
      goalsFor: playerTierInfo.goalsFor,
      winRate: playerTierInfo.winRate,
    },
  }
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
  playerTierInfo: initialTierInfo = EMPTY_TIER_INFO,
  onChange,
  onExportSuccess,
  onExportError,
  lockPlayer = false,
  exportButtonLabel,
  disabled = false,
  className,
}: StickerEditorProps) {
  const { t } = useAppTranslation()
  const previewRef = useRef<HTMLElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [playerTierInfo, setPlayerTierInfo] = useState(initialTierInfo)
  const [isLoadingTier, setIsLoadingTier] = useState(false)
  const resolvedExportLabel = exportButtonLabel ?? t('stickers.modal.exportPng')

  useEffect(() => {
    setPlayerTierInfo(initialTierInfo)
  }, [initialTierInfo])

  useEffect(() => {
    if (lockPlayer || !values.playerId.trim()) {
      return
    }

    let cancelled = false

    async function loadTier() {
      setIsLoadingTier(true)

      try {
        const tierInfo = await window.api.stickers.getPlayerTier(values.playerId)
        if (!cancelled) {
          setPlayerTierInfo(tierInfo)
        }
      } catch {
        if (!cancelled) {
          setPlayerTierInfo({ ...EMPTY_TIER_INFO, playerId: values.playerId })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTier(false)
        }
      }
    }

    void loadTier()

    return () => {
      cancelled = true
    }
  }, [lockPlayer, values.playerId])

  const selectedPlayer = players.find((player) => player.id === values.playerId)
  const previewData = buildPreviewData(players, values, playerTierInfo)
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

      onExportSuccess?.(
        t('stickers.editor.exportSuccess', { path: result.generatedImagePath }),
        result.sticker,
      )
    } catch (error) {
      onExportError?.(getErrorMessage(error, t))
    } finally {
      setIsExporting(false)
    }
  }

  const rootClassName = ['sticker-editor', className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <div className="sticker-editor__form card">
        <h2 className="sticker-editor__title">{t('stickers.editor.details')}</h2>

        {!lockPlayer ? (
          <label className="field">
            <span className="field__label">{t('common.player')}</span>
            <select
              className="field__input"
              value={values.playerId}
              onChange={(event) => handlePlayerChange(event.target.value)}
              disabled={disabled || players.length === 0}
            >
              <option value="">{t('stickers.editor.selectPlayer')}</option>
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

        {values.playerId && (
          <div className="sticker-editor__performance card">
            <div className="sticker-editor__performance-header">
              <h3 className="sticker-editor__performance-title">
                {t('stickers.editor.performanceTier')}
              </h3>
              <StickerTierBadge tier={playerTierInfo.tier} variant="editor" />
            </div>
            {isLoadingTier ? (
              <p className="sticker-editor__performance-loading">{t('stickers.editor.loadingStats')}</p>
            ) : (
              <dl className="sticker-editor__stats">
                <div className="sticker-editor__stat">
                  <dt>{t('stickers.editor.titlesWon')}</dt>
                  <dd>{playerTierInfo.tournamentsWon}</dd>
                </div>
                <div className="sticker-editor__stat">
                  <dt>{t('stickers.editor.goals')}</dt>
                  <dd>{playerTierInfo.goalsFor}</dd>
                </div>
                <div className="sticker-editor__stat">
                  <dt>{t('stickers.editor.winRate')}</dt>
                  <dd>{formatStickerWinRate(playerTierInfo.winRate)}</dd>
                </div>
                {playerTierInfo.historicalRank !== null && (
                  <div className="sticker-editor__stat">
                    <dt>{t('stickers.editor.historicalRank')}</dt>
                    <dd>
                      {t('stickers.editor.historicalRankValue', {
                        rank: playerTierInfo.historicalRank,
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        )}

        <label className="field">
          <span className="field__label">{t('stickers.editor.nickname')}</span>
          <input
            className="field__input"
            type="text"
            value={values.nickname}
            onChange={(event) => updateValues({ nickname: event.target.value })}
            placeholder={t('stickers.editor.nicknamePlaceholder')}
            disabled={disabled}
          />
        </label>

        <label className="field">
          <span className="field__label">{t('stickers.editor.teamName')}</span>
          <input
            className="field__input"
            type="text"
            value={values.teamName}
            onChange={(event) => updateValues({ teamName: event.target.value })}
            placeholder={t('stickers.editor.teamPlaceholder')}
            disabled={disabled}
          />
        </label>

        <div className="sticker-editor__row">
          <label className="field sticker-editor__field--half">
            <span className="field__label">{t('stickers.editor.rating')}</span>
            <input
              className="field__input"
              type="number"
              min={0}
              max={99}
              value={values.rating}
              onChange={(event) => updateValues({ rating: event.target.value })}
              placeholder={t('stickers.editor.ratingPlaceholder')}
              disabled={disabled}
            />
          </label>

          <label className="field sticker-editor__field--half">
            <span className="field__label">{t('stickers.editor.position')}</span>
            <input
              className="field__input"
              type="text"
              list="sticker-position-options"
              value={values.position}
              onChange={(event) => updateValues({ position: event.target.value.toUpperCase() })}
              placeholder={t('stickers.editor.positionPlaceholder')}
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
          <span className="field__label">{t('stickers.editor.theme')}</span>
          <input
            className="field__input"
            type="text"
            value={values.theme}
            onChange={(event) => updateValues({ theme: event.target.value })}
            placeholder={t('stickers.editor.themePlaceholder')}
            disabled={disabled}
          />
        </label>
      </div>

      <div className="sticker-editor__preview-panel">
        <h2 className="sticker-editor__title">{t('stickers.editor.livePreview')}</h2>
        <p className="sticker-editor__preview-note">{t('stickers.editor.previewNote')}</p>
        <StickerPreview ref={previewRef} data={previewData} />
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => void handleExportPng()}
          disabled={disabled || isExporting || !canExport}
        >
          {isExporting ? t('common.exporting') : resolvedExportLabel}
        </button>
      </div>
    </div>
  )
}
