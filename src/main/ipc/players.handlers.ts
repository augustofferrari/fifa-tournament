import { ipcMain } from 'electron'
import {
  getPlayerRepository,
  playerPhotoService,
  ValidationError,
} from '@modules/players'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type {
  CreatePlayerRequest,
  CreatePlayerResponse,
  DeletePlayerRequest,
  DeletePlayerResponse,
  GetPlayerByIdRequest,
  GetPlayerByIdResponse,
  GetPlayerPhotoUrlRequest,
  GetPlayerPhotoUrlResponse,
  ListPlayersRequest,
  ListPlayersResponse,
  SelectPlayerPhotoResponse,
  UpdatePlayerRequest,
  UpdatePlayerResponse,
} from '@shared/types/player-ipc'
import { runIpcHandler } from './utils'

export function registerPlayerHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.PLAYERS_CREATE,
    (_event, request: CreatePlayerRequest) =>
      runIpcHandler<CreatePlayerResponse>(() => getPlayerRepository().createPlayer(request)),
  )

  ipcMain.handle(IPC_CHANNELS.PLAYERS_UPDATE, (_event, request: UpdatePlayerRequest) =>
    runIpcHandler<UpdatePlayerResponse>(() => {
      const existing = getPlayerRepository().getPlayerById(request.id)

      if (!existing) {
        throw new ValidationError(`Player not found: ${request.id}`)
      }

      const updated = getPlayerRepository().updatePlayer(request.id, request.input)

      if (
        request.input.photoPath !== undefined &&
        existing.photoPath &&
        existing.photoPath !== updated.photoPath
      ) {
        playerPhotoService.deletePhotoIfManaged(existing.photoPath)
      }

      return updated
    }),
  )

  ipcMain.handle(IPC_CHANNELS.PLAYERS_DELETE, (_event, request: DeletePlayerRequest) =>
    runIpcHandler<DeletePlayerResponse>(() => {
      const existing = getPlayerRepository().getPlayerById(request.id)
      const deleted = getPlayerRepository().deletePlayer(request.id)

      if (!deleted) {
        throw new ValidationError(`Player not found: ${request.id}`)
      }

      playerPhotoService.deletePhotoIfManaged(existing?.photoPath ?? null)

      return { deleted: true }
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.PLAYERS_GET_BY_ID,
    (_event, request: GetPlayerByIdRequest) =>
      runIpcHandler<GetPlayerByIdResponse>(() => getPlayerRepository().getPlayerById(request.id)),
  )

  ipcMain.handle(IPC_CHANNELS.PLAYERS_LIST, (_event, request: ListPlayersRequest = {}) =>
    runIpcHandler<ListPlayersResponse>(() => getPlayerRepository().listPlayers(request)),
  )

  ipcMain.handle(IPC_CHANNELS.PLAYERS_SELECT_PHOTO, async () =>
    runIpcHandler<SelectPlayerPhotoResponse>(() => playerPhotoService.selectAndCopyPhoto()),
  )

  ipcMain.handle(
    IPC_CHANNELS.PLAYERS_GET_PHOTO_URL,
    (_event, request: GetPlayerPhotoUrlRequest) =>
      runIpcHandler<GetPlayerPhotoUrlResponse>(() => ({
        url: playerPhotoService.getPhotoUrl(request.photoPath),
      })),
  )
}
