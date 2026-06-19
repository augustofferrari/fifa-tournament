import { getDatabase } from '@database'
import { getPlayerRepository } from '@modules/players/instance'
import { StickerRepository } from './sticker.repository'

let repository: StickerRepository | undefined

export function getStickerRepository(): StickerRepository {
  if (!repository) {
    repository = new StickerRepository(getDatabase(), getPlayerRepository())
  }

  return repository
}
