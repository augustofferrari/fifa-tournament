import { BrowserWindow, shell } from 'electron'
import { getPreloadPath, getRendererPath, getRendererUrl, WINDOW_DEFAULTS } from './config'

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    ...WINDOW_DEFAULTS,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  loadRenderer(mainWindow)

  return mainWindow
}

function loadRenderer(window: BrowserWindow): void {
  const rendererUrl = getRendererUrl()

  if (rendererUrl) {
    window.loadURL(rendererUrl)
    return
  }

  window.loadFile(getRendererPath())
}
