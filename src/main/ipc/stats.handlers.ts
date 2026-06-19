import { ipcMain } from 'electron'
import { getHeadToHeadStatsService } from '@modules/head-to-head'
import { getHistoricalStatsRepository } from '@modules/historical-stats'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type {
  GetHeadToHeadRequest,
  GetHeadToHeadResponse,
  GetHistoricalRankingResponse,
} from '@shared/types/stats-ipc'
import { runIpcHandler } from './utils'

export function registerStatsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.STATS_GET_HISTORICAL_RANKING, () =>
    runIpcHandler<GetHistoricalRankingResponse>(() =>
      getHistoricalStatsRepository().getGlobalPlayerStats().players,
    ),
  )

  ipcMain.handle(
    IPC_CHANNELS.STATS_GET_HEAD_TO_HEAD,
    (_event, request: GetHeadToHeadRequest) =>
      runIpcHandler<GetHeadToHeadResponse>(() =>
        getHeadToHeadStatsService().getHeadToHeadStats(request.playerAId, request.playerBId),
      ),
  )
}
