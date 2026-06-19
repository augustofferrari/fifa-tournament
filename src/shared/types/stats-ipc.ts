import type { HeadToHeadStats } from './head-to-head'
import type { PlayerHistoricalStats } from './historical-stats'
import type { PlayerStreaks } from './player-streaks'

export type GetHistoricalRankingResponse = PlayerHistoricalStats[]

export interface GetHeadToHeadRequest {
  playerAId: string
  playerBId: string
}

export type GetHeadToHeadResponse = HeadToHeadStats

export interface GetPlayerStreaksRequest {
  playerId: string
}

export type GetPlayerStreaksResponse = PlayerStreaks

export type GetAllPlayerStreaksResponse = PlayerStreaks[]
