import type {
  GetAllPlayerStreaksResponse,
  GetHeadToHeadResponse,
  GetHistoricalRankingResponse,
  GetPlayerStreaksResponse,
} from '@shared/types/stats-ipc'
import type { HeadToHeadStats } from '@shared/types/head-to-head'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'
import type { PlayerStreaks } from '@shared/types/player-streaks'

export interface StatsNamespace {
  getHistoricalRanking(): Promise<GetHistoricalRankingResponse>
  getHeadToHead(playerAId: string, playerBId: string): Promise<GetHeadToHeadResponse>
  getPlayerStreaks(playerId: string): Promise<GetPlayerStreaksResponse>
  getAllPlayerStreaks(): Promise<GetAllPlayerStreaksResponse>
}

export type { HeadToHeadStats, PlayerHistoricalStats, PlayerStreaks }
