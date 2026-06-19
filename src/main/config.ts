import { join } from 'node:path'

export const WINDOW_DEFAULTS = {
  width: 1200,
  height: 800,
  minWidth: 900,
  minHeight: 600,
} as const

export function getPreloadPath(): string {
  return join(__dirname, '../preload/index.js')
}

export function getRendererPath(): string {
  return join(__dirname, '../renderer/index.html')
}

export function getRendererUrl(): string | undefined {
  return process.env['ELECTRON_RENDERER_URL']
}
