import type { ElectronApi, Platform } from '@shared/types/api'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import { ipc } from './ipc'

export function createApi(): ElectronApi {
  return {
    app: {
      platform: process.platform as Platform,
      ping: () => ipc.invokeResult(IPC_CHANNELS.APP_PING),
    },
    players: {
      create: (input) => ipc.invokeResult(IPC_CHANNELS.PLAYERS_CREATE, input),
      update: (id, input) => ipc.invokeResult(IPC_CHANNELS.PLAYERS_UPDATE, { id, input }),
      delete: (id) => ipc.invokeResult(IPC_CHANNELS.PLAYERS_DELETE, { id }),
      getById: (id) => ipc.invokeResult(IPC_CHANNELS.PLAYERS_GET_BY_ID, { id }),
      list: (options) => ipc.invokeResult(IPC_CHANNELS.PLAYERS_LIST, options ?? {}),
      selectPhoto: () => ipc.invokeResult(IPC_CHANNELS.PLAYERS_SELECT_PHOTO),
      getPhotoUrl: (photoPath) =>
        ipc.invokeResult(IPC_CHANNELS.PLAYERS_GET_PHOTO_URL, { photoPath }),
    },
    tournaments: {
      create: (input) => ipc.invokeResult(IPC_CHANNELS.TOURNAMENTS_CREATE, input),
      getById: (id) => ipc.invokeResult(IPC_CHANNELS.TOURNAMENTS_GET_BY_ID, { id }),
      list: (options) => ipc.invokeResult(IPC_CHANNELS.TOURNAMENTS_LIST, options ?? {}),
      addPlayers: (tournamentId, playerIds) =>
        ipc.invokeResult(IPC_CHANNELS.TOURNAMENTS_ADD_PLAYERS, { tournamentId, playerIds }),
      getPlayers: (tournamentId) =>
        ipc.invokeResult(IPC_CHANNELS.TOURNAMENTS_GET_PLAYERS, { tournamentId }),
      getStandings: (tournamentId) =>
        ipc.invokeResult(IPC_CHANNELS.TOURNAMENTS_GET_STANDINGS, { tournamentId }),
    },
    matches: {
      generateFixture: (tournamentId) =>
        ipc.invokeResult(IPC_CHANNELS.MATCHES_GENERATE_FIXTURE, { tournamentId }),
      list: (options) => ipc.invokeResult(IPC_CHANNELS.MATCHES_LIST, options),
      updateResult: (matchId, homeGoals, awayGoals) =>
        ipc.invokeResult(IPC_CHANNELS.MATCHES_UPDATE_RESULT, { matchId, homeGoals, awayGoals }),
    },
    stickers: {
      create: (input) => ipc.invokeResult(IPC_CHANNELS.STICKERS_CREATE, input),
      update: (id, input) => ipc.invokeResult(IPC_CHANNELS.STICKERS_UPDATE, { id, input }),
      getByPlayerId: (playerId) =>
        ipc.invokeResult(IPC_CHANNELS.STICKERS_GET_BY_PLAYER_ID, { playerId }),
      list: (options) => ipc.invokeResult(IPC_CHANNELS.STICKERS_LIST, options ?? {}),
      exportPng: (input) => ipc.invokeResult(IPC_CHANNELS.STICKERS_EXPORT_PNG, input),
      getImageUrl: (imagePath) =>
        ipc.invokeResult(IPC_CHANNELS.STICKERS_GET_IMAGE_URL, { imagePath }),
    },
    stats: {
      getHistoricalRanking: () =>
        ipc.invokeResult(IPC_CHANNELS.STATS_GET_HISTORICAL_RANKING),
    },
  }
}
