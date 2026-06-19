import { getDatabase } from '@database'
import { TournamentPhaseService } from './tournament-phase.service'

let tournamentPhaseService: TournamentPhaseService | undefined

export function getTournamentPhaseService(): TournamentPhaseService {
  if (!tournamentPhaseService) {
    tournamentPhaseService = new TournamentPhaseService(getDatabase())
  }

  return tournamentPhaseService
}
