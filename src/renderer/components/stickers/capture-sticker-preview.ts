import { toPng } from 'html-to-image'

async function inlineImages(node: HTMLElement): Promise<() => void> {
  const restores: Array<() => void> = []
  const images = node.querySelectorAll('img')

  for (const image of images) {
    if (!image.src || image.src.startsWith('data:')) {
      continue
    }

    const originalSrc = image.src

    try {
      const response = await fetch(image.src)
      const blob = await response.blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      image.src = dataUrl
      restores.push(() => {
        image.src = originalSrc
      })
    } catch {
      // Keep original source if inlining fails.
    }
  }

  return () => {
    for (const restore of restores) {
      restore()
    }
  }
}

export async function captureStickerPreviewPng(node: HTMLElement): Promise<string> {
  const restoreImages = await inlineImages(node)

  try {
    return await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
    })
  } finally {
    restoreImages()
  }
}
