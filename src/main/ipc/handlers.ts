import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { PingResponse } from '@shared/types/api'
import { registerMatchHandlers } from './matches.handlers'
import { registerPlayerHandlers } from './players.handlers'
import { registerStatsHandlers } from './stats.handlers'
import { registerStickerHandlers } from './stickers.handlers'
import { registerTournamentHandlers } from './tournaments.handlers'
import { runIpcHandler } from './utils'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.APP_PING, () =>
    runIpcHandler<PingResponse>(() => 'pong'),
  )

  registerPlayerHandlers()
  registerTournamentHandlers()
  registerMatchHandlers()
  registerStickerHandlers()
  registerStatsHandlers()
}
