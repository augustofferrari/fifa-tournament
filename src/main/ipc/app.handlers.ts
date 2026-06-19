import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import { databaseResetService } from '@modules/app/database-reset.service'
import { runIpcHandler } from './utils'

export function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.APP_RESET_ALL_DATA, () =>
    runIpcHandler(() => {
      databaseResetService.resetAllData()
    }),
  )
}
