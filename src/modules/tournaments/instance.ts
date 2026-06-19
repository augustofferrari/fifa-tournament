import { getDatabase } from '@database'
import { TournamentRepository } from './tournament.repository'

let repository: TournamentRepository | undefined

export function getTournamentRepository(): TournamentRepository {
  if (!repository) {
    repository = new TournamentRepository(getDatabase())
  }

  return repository
}
