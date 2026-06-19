import type { TFunction } from 'i18next'
import { translate, type Locale } from '@shared/i18n'
import { StickerTier } from '@shared/types/sticker-tier'

const TIER_LABEL_KEYS: Record<StickerTier, string> = {
  [StickerTier.BRONZE]: 'stickers.tier.bronze',
  [StickerTier.SILVER]: 'stickers.tier.silver',
  [StickerTier.GOLD]: 'stickers.tier.gold',
  [StickerTier.LEGEND]: 'stickers.tier.legend',
}

export function getStickerTierClassName(tier: StickerTier, prefix: string): string {
  return `${prefix}--tier-${tier.toLowerCase()}`
}

export function formatStickerTierLabel(tier: StickerTier, tOrLocale: TFunction | Locale): string {
  const key = TIER_LABEL_KEYS[tier]

  if (typeof tOrLocale === 'function') {
    return tOrLocale(key)
  }

  return translate(key, tOrLocale)
}
