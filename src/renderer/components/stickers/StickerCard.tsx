import type { Player } from '@shared/types/player'
import type { Sticker } from '@shared/types/sticker'
import type { StickerTier } from '@shared/types/sticker-tier'
import { PlayerPhoto } from '@renderer/components/players/PlayerPhoto'
import { StickerGeneratedImage } from './StickerGeneratedImage'
import { StickerTierBadge } from './StickerTierBadge'
import { getStickerTierClassName } from './sticker-tier-utils'
import { hasExportedSticker } from './sticker-utils'

interface StickerCardProps {
  player: Player
  sticker: Sticker | null
  tier: StickerTier
  onCreate: () => void
  onEdit: () => void
}

export function StickerCard({ player, sticker, tier, onCreate, onEdit }: StickerCardProps) {
  const exported = hasExportedSticker(sticker)
  const actionLabel = exported ? 'Edit sticker' : 'Create sticker'

  function handleAction() {
    if (exported) {
      onEdit()
      return
    }

    onCreate()
  }

  return (
    <article className={`sticker-card${exported ? ' sticker-card--filled' : ''}`}>
      <button
        className="sticker-card__button"
        type="button"
        onClick={handleAction}
        aria-label={`${actionLabel} for ${player.name}`}
      >
        <div className={`sticker-card__slot ${getStickerTierClassName(tier, 'sticker-card__slot')}`}>
          <StickerTierBadge tier={tier} variant="card" />
          {exported && sticker?.generatedImagePath ? (
            <StickerGeneratedImage
              imagePath={sticker.generatedImagePath}
              alt={`${player.name} sticker`}
            />
          ) : (
            <div className="sticker-card__empty">
              <PlayerPhoto photoPath={player.photoPath} alt={player.name} size="md" />
              <span className="sticker-card__cta">Create sticker</span>
            </div>
          )}
        </div>

        <footer className="sticker-card__footer">
          <span className="sticker-card__name">{player.name}</span>
          {player.teamName && <span className="sticker-card__team">{player.teamName}</span>}
          {exported && <span className="sticker-card__action">Edit sticker</span>}
        </footer>
      </button>
    </article>
  )
}
