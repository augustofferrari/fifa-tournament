import { describe, expect, it } from 'vitest'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'
import { StickerTier } from '@shared/types/sticker-tier'
import {
  getHistoricalRank,
  hasPositiveWinRate,
  isGoldTier,
  isLegendTier,
  resolveStickerTier,
} from './sticker-tier.calculator'

function createStats(overrides: Partial<PlayerHistoricalStats> = {}): PlayerHistoricalStats {
  return {
    playerId: 'player-1',
    playerName: 'Player One',
    tournamentsPlayed: 0,
    tournamentsWon: 0,
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    winRate: 0,
    ...overrides,
  }
}

describe('sticker-tier.calculator', () => {
  describe('getHistoricalRank', () => {
    it('returns 1-based rank for a player in the sorted list', () => {
      const ranked = [
        createStats({ playerId: 'a' }),
        createStats({ playerId: 'b' }),
        createStats({ playerId: 'c' }),
      ]

      expect(getHistoricalRank(ranked, 'b')).toBe(2)
    })

    it('returns null when the player is not ranked', () => {
      expect(getHistoricalRank([createStats({ playerId: 'a' })], 'missing')).toBeNull()
    })
  })

  describe('isLegendTier', () => {
    it('is true for a tournament champion', () => {
      expect(isLegendTier(createStats({ tournamentsWon: 1 }))).toBe(true)
    })

    it('is true for three or more championships', () => {
      expect(isLegendTier(createStats({ tournamentsWon: 3 }))).toBe(true)
    })

    it('is false without championships', () => {
      expect(isLegendTier(createStats({ tournamentsWon: 0 }))).toBe(false)
    })
  })

  describe('isGoldTier', () => {
    it('is true for ranks 1 through 3', () => {
      expect(isGoldTier(1)).toBe(true)
      expect(isGoldTier(3)).toBe(true)
    })

    it('is false outside the top 3', () => {
      expect(isGoldTier(4)).toBe(false)
      expect(isGoldTier(null)).toBe(false)
    })
  })

  describe('hasPositiveWinRate', () => {
    it('requires more wins than losses overall', () => {
      expect(hasPositiveWinRate(createStats({ matchesPlayed: 4, winRate: 0.75 }))).toBe(true)
      expect(hasPositiveWinRate(createStats({ matchesPlayed: 4, winRate: 0.5 }))).toBe(false)
      expect(hasPositiveWinRate(createStats({ matchesPlayed: 0, winRate: 0 }))).toBe(false)
    })
  })

  describe('resolveStickerTier', () => {
    it('assigns LEGEND to tournament champions before other tiers', () => {
      expect(resolveStickerTier(createStats({ tournamentsWon: 1 }), 5)).toBe(StickerTier.LEGEND)
    })

    it('assigns GOLD to top 3 players without championships', () => {
      expect(resolveStickerTier(createStats({ tournamentsWon: 0 }), 2)).toBe(StickerTier.GOLD)
    })

    it('assigns SILVER to players with a positive win rate', () => {
      expect(
        resolveStickerTier(createStats({ tournamentsWon: 0, matchesPlayed: 6, winRate: 0.667 }), 8),
      ).toBe(StickerTier.SILVER)
    })

    it('assigns BRONZE as the default tier', () => {
      expect(resolveStickerTier(createStats(), 10)).toBe(StickerTier.BRONZE)
    })

    it('prefers LEGEND over GOLD when both apply', () => {
      expect(
        resolveStickerTier(createStats({ tournamentsWon: 2, matchesPlayed: 10, winRate: 0.8 }), 1),
      ).toBe(StickerTier.LEGEND)
    })
  })
})
