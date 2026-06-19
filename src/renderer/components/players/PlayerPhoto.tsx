import { useEffect, useState } from 'react'

interface PlayerPhotoProps {
  photoPath: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg'
}

export function PlayerPhoto({ photoPath, alt, size = 'md' }: PlayerPhotoProps) {
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
    return <div className={`player-photo player-photo--${size} player-photo--empty`} aria-hidden />
  }

  return <img className={`player-photo player-photo--${size}`} src={url} alt={alt} />
}
