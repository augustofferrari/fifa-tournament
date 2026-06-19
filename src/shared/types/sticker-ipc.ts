import type {
  CreateStickerInput,
  ListStickersOptions,
  Sticker,
  UpdateStickerInput,
} from './sticker'

export type CreateStickerRequest = CreateStickerInput
export type CreateStickerResponse = Sticker

export interface UpdateStickerRequest {
  id: string
  input: UpdateStickerInput
}
export type UpdateStickerResponse = Sticker

export interface GetStickerByPlayerIdRequest {
  playerId: string
}
export type GetStickerByPlayerIdResponse = Sticker[]

export type ListStickersRequest = ListStickersOptions
export type ListStickersResponse = Sticker[]

export interface ExportStickerPngRequest {
  pngDataUrl: string
  playerId: string
  theme: string
  rating?: number | null
  position?: string | null
}

export interface ExportStickerPngResponse {
  sticker: Sticker
  generatedImagePath: string
}

export interface GetStickerImageUrlRequest {
  imagePath: string | null
}

export interface GetStickerImageUrlResponse {
  url: string | null
}
