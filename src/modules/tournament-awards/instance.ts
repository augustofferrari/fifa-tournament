import { TournamentAwardsService } from './tournament-awards.service'

let tournamentAwardsService: TournamentAwardsService | null = null

export function getTournamentAwardsService(): TournamentAwardsService {
  if (!tournamentAwardsService) {
    tournamentAwardsService = new TournamentAwardsService()
  }

  return tournamentAwardsService
}
