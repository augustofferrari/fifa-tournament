import type { HeadToHeadStats } from './head-to-head'
import type { PlayerHistoricalStats } from './historical-stats'

export type GetHistoricalRankingResponse = PlayerHistoricalStats[]

export interface GetHeadToHeadRequest {
  playerAId: string
  playerBId: string
}

export type GetHeadToHeadResponse = HeadToHeadStats
