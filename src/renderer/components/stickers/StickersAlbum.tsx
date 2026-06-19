import type { Player } from '@shared/types/player'
import type { Sticker } from '@shared/types/sticker'
import { StickerCard } from './StickerCard'
import { buildStickersByPlayerId, getPrimarySticker } from './sticker-utils'

interface StickersAlbumProps {
  players: Player[]
  stickers: Sticker[]
  onCreateSticker: (player: Player) => void
  onEditSticker: (player: Player, sticker: Sticker | null) => void
}

export function StickersAlbum({
  players,
  stickers,
  onCreateSticker,
  onEditSticker,
}: StickersAlbumProps) {
  const stickersByPlayerId = buildStickersByPlayerId(stickers)

  return (
    <div className="stickers-album">
      {players.map((player) => {
        const playerStickers = stickersByPlayerId.get(player.id) ?? []
        const primarySticker = getPrimarySticker(playerStickers)

        return (
          <StickerCard
            key={player.id}
            player={player}
            sticker={primarySticker}
            onCreate={() => onCreateSticker(player)}
            onEdit={() => onEditSticker(player, primarySticker)}
          />
        )
      })}
    </div>
  )
}
