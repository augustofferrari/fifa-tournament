import { getDatabase } from '@database'
import { getTournamentRepository } from '@modules/tournaments/instance'
import { MatchRepository } from './match.repository'

let repository: MatchRepository | undefined

export function getMatchRepository(): MatchRepository {
  if (!repository) {
    repository = new MatchRepository(getDatabase(), getTournamentRepository())
  }

  return repository
}
