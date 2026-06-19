import { StickerRepository } from './sticker.repository'
import { StickerTierService } from './sticker-tier.service'

let stickerRepository: StickerRepository | null = null
let stickerTierService: StickerTierService | null = null

export function getStickerRepository(): StickerRepository {
  if (!stickerRepository) {
    stickerRepository = new StickerRepository()
  }

  return stickerRepository
}

export function getStickerTierService(): StickerTierService {
  if (!stickerTierService) {
    stickerTierService = new StickerTierService()
  }

  return stickerTierService
}
