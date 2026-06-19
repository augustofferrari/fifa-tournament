import { ipcMain } from 'electron'
import { getHistoricalStatsRepository } from '@modules/historical-stats'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { GetHistoricalRankingResponse } from '@shared/types/stats-ipc'
import { runIpcHandler } from './utils'

export function registerStatsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.STATS_GET_HISTORICAL_RANKING, () =>
    runIpcHandler<GetHistoricalRankingResponse>(() =>
      getHistoricalStatsRepository().getGlobalPlayerStats().players,
    ),
  )
}
