export enum StickerTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  LEGEND = 'LEGEND',
}

export const STICKER_TIER_ORDER: readonly StickerTier[] = [
  StickerTier.LEGEND,
  StickerTier.GOLD,
  StickerTier.SILVER,
  StickerTier.BRONZE,
]

export interface PlayerStickerTierInfo {
  playerId: string
  tier: StickerTier
  historicalRank: number | null
  tournamentsWon: number
  goalsFor: number
  winRate: number
}
