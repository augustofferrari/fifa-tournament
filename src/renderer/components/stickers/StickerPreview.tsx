import { forwardRef, useEffect, useState } from 'react'
import { StickerTier } from '@shared/types/sticker-tier'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { StickerTierBadge } from './StickerTierBadge'
import { formatStickerWinRate } from './sticker-stats-utils'
import { getStickerTierClassName } from './sticker-tier-utils'

interface StickerPreviewPhotoProps {
  photoPath: string | null
  alt: string
}

function StickerPreviewPhoto({ photoPath, alt }: StickerPreviewPhotoProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPhoto() {
      if (!photoPath) {
        setUrl(null)
        return
      }

      try {
        const response = await window.api.players.getPhotoUrl(photoPath)
        if (!cancelled) {
          setUrl(response.url)
        }
      } catch {
        if (!cancelled) {
          setUrl(null)
        }
      }
    }

    void loadPhoto()

    return () => {
      cancelled = true
    }
  }, [photoPath])

  if (!url) {
    return <div className="sticker-preview__photo sticker-preview__photo--empty" aria-hidden />
  }

  return <img className="sticker-preview__photo" src={url} alt={alt} />
}

export interface StickerPreviewStats {
  tournamentsWon: number
  goalsFor: number
  winRate: number
}

export interface StickerPreviewData {
  playerName: string
  nickname: string
  teamName: string
  photoPath: string | null
  rating: number | null
  position: string
  theme: string
  tier?: StickerTier | null
  stats?: StickerPreviewStats | null
}

interface StickerPreviewProps {
  data: StickerPreviewData
  className?: string
}

function formatThemeLabel(theme: string, defaultTheme: string): string {
  const trimmed = theme.trim()

  if (!trimmed) {
    return defaultTheme
  }

  return trimmed
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase())
    .join(' ')
}

const EMPTY_STATS: StickerPreviewStats = {
  tournamentsWon: 0,
  goalsFor: 0,
  winRate: 0,
}

export const StickerPreview = forwardRef<HTMLElement, StickerPreviewProps>(function StickerPreview(
  { data, className },
  ref,
) {
  const { t } = useAppTranslation()
  const themeLabel = formatThemeLabel(data.theme, t('stickers.preview.defaultTheme'))
  const name = data.nickname.trim() || data.playerName.trim() || t('stickers.preview.defaultPlayerName')
  const team = data.teamName.trim() || t('stickers.preview.defaultTeam')
  const position = data.position.trim().toUpperCase() || t('common.none')
  const rating = data.rating !== null && data.rating >= 0 ? data.rating : null
  const tier = data.tier ?? StickerTier.BRONZE
  const stats = data.stats ?? EMPTY_STATS

  const rootClassName = [
    'sticker-preview',
    getStickerTierClassName(tier, 'sticker-preview'),
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article ref={ref} className={rootClassName} aria-label={t('stickers.preview.ariaPreview', { name })}>
      <div className="sticker-preview__frame">
        <div className="sticker-preview__perforation" aria-hidden />

        <div className="sticker-preview__card">
          <header className="sticker-preview__header">
            <div className="sticker-preview__header-top">
              <span className="sticker-preview__brand">{t('stickers.preview.brand')}</span>
              <StickerTierBadge tier={tier} variant="header" />
            </div>
            <span className="sticker-preview__theme">{themeLabel}</span>
          </header>

          <div className="sticker-preview__body">
            <div className="sticker-preview__badge sticker-preview__badge--position">{position}</div>

            {rating !== null && (
              <div className="sticker-preview__badge sticker-preview__badge--rating">
                <span className="sticker-preview__rating-value">{rating}</span>
                <span className="sticker-preview__rating-label">{t('stickers.preview.ovr')}</span>
              </div>
            )}

            <div className="sticker-preview__photo-wrap">
              <StickerPreviewPhoto photoPath={data.photoPath} alt={name} />
            </div>

            <div className="sticker-preview__stats" aria-label={t('stickers.preview.ariaHistoricalStats')}>
              <div className="sticker-preview__stat">
                <span className="sticker-preview__stat-value">{stats.tournamentsWon}</span>
                <span className="sticker-preview__stat-label">{t('stickers.preview.titles')}</span>
              </div>
              <div className="sticker-preview__stat">
                <span className="sticker-preview__stat-value">{stats.goalsFor}</span>
                <span className="sticker-preview__stat-label">{t('stickers.preview.goals')}</span>
              </div>
              <div className="sticker-preview__stat">
                <span className="sticker-preview__stat-value">{formatStickerWinRate(stats.winRate)}</span>
                <span className="sticker-preview__stat-label">{t('stickers.preview.winRate')}</span>
              </div>
            </div>
          </div>

          <footer className="sticker-preview__footer">
            <div className="sticker-preview__name">{name}</div>
            <div className="sticker-preview__team">{team}</div>
          </footer>
        </div>
      </div>
    </article>
  )
})
