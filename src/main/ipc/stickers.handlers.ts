import { ipcMain } from 'electron'
import { getStickerRepository, stickerExportService } from '@modules/stickers'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type {
  CreateStickerRequest,
  CreateStickerResponse,
  ExportStickerPngRequest,
  ExportStickerPngResponse,
  GetStickerByPlayerIdRequest,
  GetStickerByPlayerIdResponse,
  GetStickerImageUrlRequest,
  GetStickerImageUrlResponse,
  ListStickersRequest,
  ListStickersResponse,
  UpdateStickerRequest,
  UpdateStickerResponse,
} from '@shared/types/sticker-ipc'
import { runIpcHandler } from './utils'

export function registerStickerHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.STICKERS_CREATE,
    (_event, request: CreateStickerRequest) =>
      runIpcHandler<CreateStickerResponse>(() => getStickerRepository().createSticker(request)),
  )

  ipcMain.handle(IPC_CHANNELS.STICKERS_UPDATE, (_event, request: UpdateStickerRequest) =>
    runIpcHandler<UpdateStickerResponse>(() =>
      getStickerRepository().updateSticker(request.id, request.input),
    ),
  )

  ipcMain.handle(
    IPC_CHANNELS.STICKERS_GET_BY_PLAYER_ID,
    (_event, request: GetStickerByPlayerIdRequest) =>
      runIpcHandler<GetStickerByPlayerIdResponse>(() =>
        getStickerRepository().getStickerByPlayerId(request.playerId),
      ),
  )

  ipcMain.handle(IPC_CHANNELS.STICKERS_LIST, (_event, request: ListStickersRequest = {}) =>
    runIpcHandler<ListStickersResponse>(() => getStickerRepository().listStickers(request)),
  )

  ipcMain.handle(
    IPC_CHANNELS.STICKERS_EXPORT_PNG,
    (_event, request: ExportStickerPngRequest) =>
      runIpcHandler<ExportStickerPngResponse>(() => {
        const existingStickers = getStickerRepository().getStickerByPlayerId(request.playerId)
        const existing = existingStickers.find((sticker) => sticker.theme === request.theme.trim())

        const generatedImagePath = stickerExportService.savePngFromDataUrl(request.pngDataUrl)

        if (existing?.generatedImagePath) {
          stickerExportService.deleteImageIfManaged(existing.generatedImagePath)
        }

        const sticker = getStickerRepository().saveExportedSticker({
          playerId: request.playerId,
          theme: request.theme,
          generatedImagePath,
          rating: request.rating ?? null,
          position: request.position ?? null,
        })

        return {
          sticker,
          generatedImagePath,
        }
      }),
  )

  ipcMain.handle(
    IPC_CHANNELS.STICKERS_GET_IMAGE_URL,
    (_event, request: GetStickerImageUrlRequest) =>
      runIpcHandler<GetStickerImageUrlResponse>(() => ({
        url: stickerExportService.getImageUrl(request.imagePath),
      })),
  )
}
