import { ipcMain } from 'electron'
import { openTvModeWindow } from '../tv-mode-window'
import { assertNonEmptyString } from '@modules/tournaments/tournament.validation'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { OpenTvModeRequest, OpenTvModeResponse } from '@shared/types/windows-ipc'
import { runIpcHandler } from './utils'

export function registerWindowHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.WINDOWS_OPEN_TV_MODE,
    (_event, request: OpenTvModeRequest) =>
      runIpcHandler<OpenTvModeResponse>(() => {
        const tournamentId = assertNonEmptyString(request.tournamentId, 'tournamentId')
        openTvModeWindow(tournamentId)
      }),
  )
}
