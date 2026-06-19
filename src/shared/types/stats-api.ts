import type { GetHistoricalRankingResponse } from '@shared/types/stats-ipc'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'

export interface StatsNamespace {
  getHistoricalRanking(): Promise<GetHistoricalRankingResponse>
}

export type { PlayerHistoricalStats }
