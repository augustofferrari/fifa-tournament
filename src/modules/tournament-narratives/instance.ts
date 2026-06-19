import { TournamentNarrativeService } from './tournament-narrative.service'

let tournamentNarrativeService: TournamentNarrativeService | null = null

export function getTournamentNarrativeService(): TournamentNarrativeService {
  if (!tournamentNarrativeService) {
    tournamentNarrativeService = new TournamentNarrativeService()
  }

  return tournamentNarrativeService
}
