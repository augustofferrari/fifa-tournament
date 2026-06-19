import { ipcMain } from 'electron'
import { isLocale, type Locale } from '@shared/i18n'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import { databaseResetService } from '@modules/app/database-reset.service'
import { preferencesService } from '@modules/app/preferences.service'
import { runIpcHandler } from './utils'

export function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.APP_GET_LOCALE, () =>
    runIpcHandler<Locale>(() => preferencesService.getLocale()),
  )

  ipcMain.handle(IPC_CHANNELS.APP_SET_LOCALE, (_event, payload: { locale: unknown }) =>
    runIpcHandler<Locale>(() => {
      if (!payload || !isLocale(payload.locale)) {
        throw new Error(`Unsupported locale: ${String(payload?.locale)}`)
      }

      return preferencesService.setLocale(payload.locale).locale
    }),
  )

  ipcMain.handle(IPC_CHANNELS.APP_RESET_ALL_DATA, () =>
    runIpcHandler(() => {
      databaseResetService.resetAllData()
    }),
  )
}
