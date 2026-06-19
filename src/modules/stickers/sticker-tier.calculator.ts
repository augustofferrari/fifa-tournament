import type { PlayerHistoricalStats } from '@shared/types/historical-stats'
import { StickerTier } from '@shared/types/sticker-tier'

export const LEGEND_CHAMPIONSHIP_THRESHOLD = 3
export const GOLD_MAX_HISTORICAL_RANK = 3

export function getHistoricalRank(
  rankedPlayers: readonly PlayerHistoricalStats[],
  playerId: string,
): number | null {
  const index = rankedPlayers.findIndex((player) => player.playerId === playerId)

  if (index < 0) {
    return null
  }

  return index + 1
}

export function hasPositiveWinRate(stats: PlayerHistoricalStats): boolean {
  return stats.matchesPlayed > 0 && stats.winRate > 0.5
}

export function isLegendTier(stats: PlayerHistoricalStats): boolean {
  const isTournamentChampion = stats.tournamentsWon >= 1
  const hasMultipleChampionships = stats.tournamentsWon >= LEGEND_CHAMPIONSHIP_THRESHOLD

  return isTournamentChampion || hasMultipleChampionships
}

export function isGoldTier(historicalRank: number | null): boolean {
  return historicalRank !== null && historicalRank <= GOLD_MAX_HISTORICAL_RANK
}

export function resolveStickerTier(
  stats: PlayerHistoricalStats,
  historicalRank: number | null,
): StickerTier {
  if (isLegendTier(stats)) {
    return StickerTier.LEGEND
  }

  if (isGoldTier(historicalRank)) {
    return StickerTier.GOLD
  }

  if (hasPositiveWinRate(stats)) {
    return StickerTier.SILVER
  }

  return StickerTier.BRONZE
}

export function buildPlayerStickerTierInfo(
  stats: PlayerHistoricalStats,
  historicalRank: number | null,
): {
  tier: StickerTier
  historicalRank: number | null
  tournamentsWon: number
  goalsFor: number
  winRate: number
} {
  return {
    tier: resolveStickerTier(stats, historicalRank),
    historicalRank,
    tournamentsWon: stats.tournamentsWon,
    goalsFor: stats.goalsFor,
    winRate: stats.winRate,
  }
}
