export interface Sticker {
  id: string
  playerId: string
  theme: string
  generatedImagePath: string | null
  rating: number | null
  position: string | null
  createdAt: string
}

export interface CreateStickerInput {
  playerId: string
  theme: string
  generatedImagePath?: string | null
  rating?: number | null
  position?: string | null
}

export interface UpdateStickerInput {
  theme?: string
  generatedImagePath?: string | null
  rating?: number | null
  position?: string | null
}

export interface SaveExportedStickerInput {
  playerId: string
  theme: string
  generatedImagePath: string
  rating?: number | null
  position?: string | null
}

export interface ListStickersOptions {
  playerId?: string
  theme?: string
  position?: string
}
