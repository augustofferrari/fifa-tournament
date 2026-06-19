import type {
  CreateStickerInput,
  ListStickersOptions,
  Sticker,
  UpdateStickerInput,
} from '@shared/types/sticker'
import type { PlayerStickerTierInfo } from '@shared/types/sticker-tier'
import type {
  CreateStickerResponse,
  ExportStickerPngRequest,
  ExportStickerPngResponse,
  GetStickerByPlayerIdResponse,
  GetStickerImageUrlResponse,
  GetPlayerTierResponse,
  GetPlayerTiersResponse,
  ListStickersResponse,
  UpdateStickerResponse,
} from '@shared/types/sticker-ipc'

export type ExportStickerPngInput = Omit<ExportStickerPngRequest, 'pngDataUrl'> & {
  pngDataUrl: string
}

export interface StickersNamespace {
  create(input: CreateStickerInput): Promise<CreateStickerResponse>
  update(id: string, input: UpdateStickerInput): Promise<UpdateStickerResponse>
  getByPlayerId(playerId: string): Promise<GetStickerByPlayerIdResponse>
  list(options?: ListStickersOptions): Promise<ListStickersResponse>
  exportPng(input: ExportStickerPngInput): Promise<ExportStickerPngResponse>
  getImageUrl(imagePath: string | null): Promise<GetStickerImageUrlResponse>
  getPlayerTiers(): Promise<GetPlayerTiersResponse>
  getPlayerTier(playerId: string): Promise<GetPlayerTierResponse>
}

export type { Sticker }
