import type { Player } from '@shared/types/player'
import type { Sticker } from '@shared/types/sticker'
import type { PlayerStickerTierInfo } from '@shared/types/sticker-tier'
import { StickerTier } from '@shared/types/sticker-tier'
import { StickerCard } from './StickerCard'
import { buildStickersByPlayerId, getPrimarySticker } from './sticker-utils'

interface StickersAlbumProps {
  players: Player[]
  stickers: Sticker[]
  playerTiers: PlayerStickerTierInfo[]
  onCreateSticker: (player: Player) => void
  onEditSticker: (player: Player, sticker: Sticker | null) => void
}

export function StickersAlbum({
  players,
  stickers,
  playerTiers,
  onCreateSticker,
  onEditSticker,
}: StickersAlbumProps) {
  const stickersByPlayerId = buildStickersByPlayerId(stickers)
  const tiersByPlayerId = new Map(playerTiers.map((entry) => [entry.playerId, entry.tier]))

  return (
    <div className="stickers-album">
      {players.map((player) => {
        const playerStickers = stickersByPlayerId.get(player.id) ?? []
        const primarySticker = getPrimarySticker(playerStickers)
        const tier = tiersByPlayerId.get(player.id) ?? StickerTier.BRONZE

        return (
          <StickerCard
            key={player.id}
            player={player}
            sticker={primarySticker}
            tier={tier}
            onCreate={() => onCreateSticker(player)}
            onEdit={() => onEditSticker(player, primarySticker)}
          />
        )
      })}
    </div>
  )
}
