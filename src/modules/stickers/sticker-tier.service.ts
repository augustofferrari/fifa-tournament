import { getHistoricalStatsRepository } from '@modules/historical-stats'
import type { HistoricalStatsRepository } from '@modules/historical-stats/historical-stats.repository'
import type { PlayerStickerTierInfo } from '@shared/types/sticker-tier'
import {
  buildPlayerStickerTierInfo,
  getHistoricalRank,
} from './sticker-tier.calculator'
import { assertNonEmptyString } from './sticker.validation'
import { createValidationError } from '@shared/validation/errors'

export class StickerTierService {
  constructor(
    private readonly historicalStatsRepository: HistoricalStatsRepository = getHistoricalStatsRepository(),
  ) {}

  getPlayerTiers(): PlayerStickerTierInfo[] {
    const rankedPlayers = this.historicalStatsRepository.getGlobalPlayerStats().players

    return rankedPlayers.map((stats) => ({
      playerId: stats.playerId,
      ...buildPlayerStickerTierInfo(stats, getHistoricalRank(rankedPlayers, stats.playerId)),
    }))
  }

  getPlayerTier(playerId: string): PlayerStickerTierInfo {
    const validatedPlayerId = assertNonEmptyString(playerId, 'playerId')
    const rankedPlayers = this.historicalStatsRepository.getGlobalPlayerStats().players
    const stats = rankedPlayers.find((player) => player.playerId === validatedPlayerId)

    if (!stats) {
      throw createValidationError('errors.playerNotFound', { id: validatedPlayerId })
    }

    return {
      playerId: validatedPlayerId,
      ...buildPlayerStickerTierInfo(stats, getHistoricalRank(rankedPlayers, validatedPlayerId)),
    }
  }
}
