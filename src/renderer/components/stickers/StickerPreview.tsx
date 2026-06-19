import { forwardRef, useEffect, useState } from 'react'

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

export interface StickerPreviewData {
  playerName: string
  nickname: string
  teamName: string
  photoPath: string | null
  rating: number | null
  position: string
  theme: string
}

interface StickerPreviewProps {
  data: StickerPreviewData
  className?: string
}

function formatThemeLabel(theme: string): string {
  const trimmed = theme.trim()

  if (!trimmed) {
    return 'WORLD CUP ALBUM'
  }

  return trimmed
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase())
    .join(' ')
}

function displayName(data: StickerPreviewData): string {
  return data.nickname.trim() || data.playerName.trim() || 'Player Name'
}

export const StickerPreview = forwardRef<HTMLElement, StickerPreviewProps>(function StickerPreview(
  { data, className },
  ref,
) {
  const themeLabel = formatThemeLabel(data.theme)
  const name = displayName(data)
  const team = data.teamName.trim() || 'National Team'
  const position = data.position.trim().toUpperCase() || '—'
  const rating = data.rating !== null && data.rating >= 0 ? data.rating : null

  const rootClassName = ['sticker-preview', className].filter(Boolean).join(' ')

  return (
    <article ref={ref} className={rootClassName} aria-label={`Sticker preview for ${name}`}>
      <div className="sticker-preview__frame">
        <div className="sticker-preview__perforation" aria-hidden />

        <div className="sticker-preview__card">
          <header className="sticker-preview__header">
            <span className="sticker-preview__brand">Mundial Album</span>
            <span className="sticker-preview__theme">{themeLabel}</span>
          </header>

          <div className="sticker-preview__body">
            <div className="sticker-preview__badge sticker-preview__badge--position">{position}</div>

            {rating !== null && (
              <div className="sticker-preview__badge sticker-preview__badge--rating">
                <span className="sticker-preview__rating-value">{rating}</span>
                <span className="sticker-preview__rating-label">OVR</span>
              </div>
            )}

            <div className="sticker-preview__photo-wrap">
              <StickerPreviewPhoto photoPath={data.photoPath} alt={name} />
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
