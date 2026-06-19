export const IPC_CHANNELS = {
  APP_PING: 'app:ping',
  PLAYERS_CREATE: 'players:create',
  PLAYERS_UPDATE: 'players:update',
  PLAYERS_DELETE: 'players:delete',
  PLAYERS_GET_BY_ID: 'players:getById',
  PLAYERS_LIST: 'players:list',
  PLAYERS_SELECT_PHOTO: 'players:selectPhoto',
  PLAYERS_GET_PHOTO_URL: 'players:getPhotoUrl',
  TOURNAMENTS_CREATE: 'tournaments:create',
  TOURNAMENTS_GET_BY_ID: 'tournaments:getById',
  TOURNAMENTS_LIST: 'tournaments:list',
  TOURNAMENTS_ADD_PLAYERS: 'tournaments:addPlayers',
  TOURNAMENTS_GET_PLAYERS: 'tournaments:getPlayers',
  TOURNAMENTS_GET_STANDINGS: 'tournaments:getStandings',
  MATCHES_GENERATE_FIXTURE: 'matches:generateFixture',
  MATCHES_LIST: 'matches:list',
  MATCHES_UPDATE_RESULT: 'matches:updateResult',
  STICKERS_CREATE: 'stickers:create',
  STICKERS_UPDATE: 'stickers:update',
  STICKERS_GET_BY_PLAYER_ID: 'stickers:getByPlayerId',
  STICKERS_LIST: 'stickers:list',
  STICKERS_EXPORT_PNG: 'stickers:exportPng',
  STICKERS_GET_IMAGE_URL: 'stickers:getImageUrl',
  STATS_GET_HISTORICAL_RANKING: 'stats:getHistoricalRanking',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export const ALLOWED_INVOKE_CHANNELS: ReadonlySet<IpcChannel> = new Set(
  Object.values(IPC_CHANNELS),
)
