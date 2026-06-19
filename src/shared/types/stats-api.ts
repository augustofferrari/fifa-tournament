import type { GetHeadToHeadResponse, GetHistoricalRankingResponse } from '@shared/types/stats-ipc'
import type { HeadToHeadStats } from '@shared/types/head-to-head'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'

export interface StatsNamespace {
  getHistoricalRanking(): Promise<GetHistoricalRankingResponse>
  getHeadToHead(playerAId: string, playerBId: string): Promise<GetHeadToHeadResponse>
}

export type { HeadToHeadStats, PlayerHistoricalStats }
