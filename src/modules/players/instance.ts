import { getDatabase } from '@database'
import { PlayerRepository } from './player.repository'

let repository: PlayerRepository | undefined

export function getPlayerRepository(): PlayerRepository {
  if (!repository) {
    repository = new PlayerRepository(getDatabase())
  }

  return repository
}
