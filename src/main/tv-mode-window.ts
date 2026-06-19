import { BrowserWindow } from 'electron'
import { getPreloadPath, getRendererPath, getRendererUrl, WINDOW_DEFAULTS } from './config'

const tvModeWindows = new Map<string, BrowserWindow>()

function loadTvModeRoute(window: BrowserWindow, tournamentId: string): void {
  const hashRoute = `/tv/${encodeURIComponent(tournamentId)}`
  const rendererUrl = getRendererUrl()

  if (rendererUrl) {
    const baseUrl = rendererUrl.split('#')[0] ?? rendererUrl
    void window.loadURL(`${baseUrl}#${hashRoute}`)
    return
  }

  void window.loadFile(getRendererPath(), { hash: hashRoute })
}

export function openTvModeWindow(tournamentId: string): void {
  const existingWindow = tvModeWindows.get(tournamentId)

  if (existingWindow && !existingWindow.isDestroyed()) {
    if (existingWindow.isMinimized()) {
      existingWindow.restore()
    }

    existingWindow.focus()
    return
  }

  const tvWindow = new BrowserWindow({
    ...WINDOW_DEFAULTS,
    show: false,
    autoHideMenuBar: true,
    title: 'MundialApp — TV Mode',
    backgroundColor: '#070b14',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  tvModeWindows.set(tournamentId, tvWindow)

  tvWindow.on('closed', () => {
    tvModeWindows.delete(tournamentId)
  })

  tvWindow.once('ready-to-show', () => {
    tvWindow.show()
    tvWindow.maximize()
  })

  loadTvModeRoute(tvWindow, tournamentId)
}
