import { StickerTier } from '@shared/types/sticker-tier'

export function getStickerTierClassName(tier: StickerTier, prefix: string): string {
  return `${prefix}--tier-${tier.toLowerCase()}`
}

export function formatStickerTierLabel(tier: StickerTier): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase()
}
