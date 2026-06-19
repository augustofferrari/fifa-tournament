import { app, BrowserWindow } from 'electron'
import { closeDatabase, initializeDatabase } from '@database'
import { initializePlayerPhotoService } from '@modules/players/player-photo.service'
import { initializeStickerExportService } from '@modules/stickers/sticker-export.service'
import { registerIpcHandlers } from './ipc'
import { createMainWindow } from './window'

function registerAppLifecycle(): void {
  app.whenReady().then(() => {
    const userDataPath = app.getPath('userData')
    initializeDatabase(userDataPath)
    initializePlayerPhotoService(userDataPath)
    initializeStickerExportService(userDataPath)
    registerIpcHandlers()
    createMainWindow()

    // macOS: re-create a window when the dock icon is clicked and none are open.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
      }
    })
  }).catch((error: unknown) => {
    console.error('Failed to start MundialApp:', error)
    app.exit(1)
  })

  // Windows & Linux: quit when all windows are closed.
  // macOS: apps typically stay active until the user quits explicitly (Cmd+Q).
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    closeDatabase()
  })
}

registerAppLifecycle()
