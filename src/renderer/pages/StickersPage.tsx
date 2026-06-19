import { useCallback, useEffect, useState } from 'react'
import type { Player } from '@shared/types/player'
import type { Sticker } from '@shared/types/sticker'
import type { PlayerStickerTierInfo } from '@shared/types/sticker-tier'
import { StickerTier } from '@shared/types/sticker-tier'
import { PageHeader } from '@renderer/components/PageHeader'
import {
  createEditorValuesForPlayer,
  StickerEditorModal,
} from '@renderer/components/stickers/StickerEditorModal'
import { StickersAlbum } from '@renderer/components/stickers/StickersAlbum'
import type { StickerEditorValues } from '@renderer/components/stickers/StickerEditor'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { getErrorMessage } from '@renderer/i18n/ipc-error'

const EMPTY_TIER_INFO: PlayerStickerTierInfo = {
  playerId: '',
  tier: StickerTier.BRONZE,
  historicalRank: null,
  tournamentsWon: 0,
  goalsFor: 0,
  winRate: 0,
}

interface EditorSession {
  player: Player
  sticker: Sticker | null
  values: StickerEditorValues
  playerTierInfo: PlayerStickerTierInfo
}

export function StickersPage() {
  const { t } = useAppTranslation()
  const [players, setPlayers] = useState<Player[]>([])
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [playerTiers, setPlayerTiers] = useState<PlayerStickerTierInfo[]>([])
  const [editorSession, setEditorSession] = useState<EditorSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadAlbum = useCallback(async () => {
    setError(null)

    try {
      const [playerData, stickerData, tierData] = await Promise.all([
        window.api.players.list(),
        window.api.stickers.list(),
        window.api.stickers.getPlayerTiers(),
      ])

      setPlayers(playerData)
      setStickers(stickerData)
      setPlayerTiers(tierData)
    } catch (err) {
      setError(getErrorMessage(err, t))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadAlbum()
  }, [loadAlbum])

  function openEditor(player: Player, sticker: Sticker | null) {
    setError(null)
    setSuccessMessage(null)
    const playerTierInfo =
      playerTiers.find((entry) => entry.playerId === player.id) ?? {
        ...EMPTY_TIER_INFO,
        playerId: player.id,
      }

    setEditorSession({
      player,
      sticker,
      values: createEditorValuesForPlayer(player, sticker),
      playerTierInfo,
    })
  }

  function handleCreateSticker(player: Player) {
    openEditor(player, null)
  }

  function handleEditSticker(player: Player, sticker: Sticker | null) {
    openEditor(player, sticker)
  }

  function handleCloseEditor() {
    setEditorSession(null)
  }

  async function handleExportSuccess(message: string, sticker: Sticker) {
    setError(null)
    setSuccessMessage(message)
    await loadAlbum()
    setEditorSession((current) =>
      current
        ? {
            ...current,
            sticker,
            values: createEditorValuesForPlayer(current.player, sticker),
          }
        : current,
    )
  }

  function handleExportError(message: string) {
    setSuccessMessage(null)
    setError(message)
  }

  if (isLoading) {
    return (
      <section className="page page--wide">
        <PageHeader title={t('stickers.title')} description={t('stickers.description')} />
        <div className="page__empty">{t('stickers.loading')}</div>
      </section>
    )
  }

  return (
    <section className="page page--wide">
      <PageHeader title={t('stickers.title')} description={t('stickers.description')} />

      {error && <div className="alert alert--error">{error}</div>}
      {successMessage && <div className="alert alert--success">{successMessage}</div>}

      {players.length === 0 ? (
        <div className="page__empty">{t('stickers.empty')}</div>
      ) : (
        <StickersAlbum
          players={players}
          stickers={stickers}
          playerTiers={playerTiers}
          onCreateSticker={handleCreateSticker}
          onEditSticker={handleEditSticker}
        />
      )}

      <StickerEditorModal
        player={editorSession?.player ?? null}
        sticker={editorSession?.sticker ?? null}
        playerTierInfo={editorSession?.playerTierInfo ?? EMPTY_TIER_INFO}
        values={
          editorSession?.values ?? {
            playerId: '',
            nickname: '',
            teamName: '',
            rating: '',
            position: '',
            theme: 'world-cup',
          }
        }
        onChange={(values) => {
          setEditorSession((current) => (current ? { ...current, values } : current))
        }}
        onClose={handleCloseEditor}
        onExportSuccess={(message, sticker) => void handleExportSuccess(message, sticker)}
        onExportError={handleExportError}
      />
    </section>
  )
}
