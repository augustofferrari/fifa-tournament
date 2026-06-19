export type Platform =
  | 'aix'
  | 'android'
  | 'darwin'
  | 'freebsd'
  | 'haiku'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32'
  | 'cygwin'
  | 'netbsd'

import type { PlayersNamespace } from './players-api'
import type { MatchesNamespace } from './matches-api'
import type { StatsNamespace } from './stats-api'
import type { StickersNamespace } from './stickers-api'
import type { TournamentsNamespace } from './tournaments-api'
import type { WindowsNamespace } from './windows-api'

export type PingResponse = 'pong'

export interface AppNamespace {
  platform: Platform
  ping(): Promise<PingResponse>
  resetAllData(): Promise<void>
}

export interface ElectronApi {
  app: AppNamespace
  windows: WindowsNamespace
  players: PlayersNamespace
  tournaments: TournamentsNamespace
  matches: MatchesNamespace
  stickers: StickersNamespace
  stats: StatsNamespace
}

declare global {
  interface Window {
    api: ElectronApi
  }
}

export {}
