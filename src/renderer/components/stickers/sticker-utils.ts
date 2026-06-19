import type { Sticker } from '@shared/types/sticker'

export function getPrimarySticker(stickers: Sticker[]): Sticker | null {
  if (stickers.length === 0) {
    return null
  }

  const exportedStickers = stickers.filter((sticker) => sticker.generatedImagePath)

  if (exportedStickers.length > 0) {
    return exportedStickers.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!
  }

  return stickers.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!
}

export function hasExportedSticker(sticker: Sticker | null): boolean {
  return Boolean(sticker?.generatedImagePath)
}

export function buildStickersByPlayerId(stickers: Sticker[]): Map<string, Sticker[]> {
  const map = new Map<string, Sticker[]>()

  for (const sticker of stickers) {
    const existing = map.get(sticker.playerId) ?? []
    existing.push(sticker)
    map.set(sticker.playerId, existing)
  }

  return map
}
