import { useEffect, useState } from 'react'

interface StickerGeneratedImageProps {
  imagePath: string
  alt: string
}

export function StickerGeneratedImage({ imagePath, alt }: StickerGeneratedImageProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadImage() {
      try {
        const response = await window.api.stickers.getImageUrl(imagePath)

        if (!cancelled) {
          setUrl(response.url)
        }
      } catch {
        if (!cancelled) {
          setUrl(null)
        }
      }
    }

    void loadImage()

    return () => {
      cancelled = true
    }
  }, [imagePath])

  if (!url) {
    return <div className="sticker-card__image sticker-card__image--loading" aria-hidden />
  }

  return <img className="sticker-card__image" src={url} alt={alt} />
}
