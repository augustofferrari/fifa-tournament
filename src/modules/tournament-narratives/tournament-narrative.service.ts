import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import { MatchRepository } from '@modules/matches/match.repository'
import { assertNonEmptyString, ValidationError } from '@modules/players/player.validation'
import { getTournamentAwardsService } from '@modules/tournament-awards'
import type { TournamentAwardsService } from '@modules/tournament-awards/tournament-awards.service'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import type { TournamentNarrative } from '@shared/types/tournament-narrative'
import { generateTournamentNarrative } from './tournament-narrative.calculator'

export class TournamentNarrativeService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly matchRepository: MatchRepository = new MatchRepository(db, tournamentRepository),
    private readonly tournamentAwardsService: TournamentAwardsService = getTournamentAwardsService(),
  ) {}

  getTournamentNarrative(tournamentId: string): TournamentNarrative {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const tournament = this.tournamentRepository.getTournamentById(validatedTournamentId)

    if (!tournament) {
      throw new ValidationError(`Tournament not found: ${validatedTournamentId}`)
    }

    const standings = this.tournamentRepository.getTournamentStandings(validatedTournamentId)
    const matches = this.matchRepository.listMatchesByTournament({
      tournamentId: validatedTournamentId,
    })
    const awards = this.tournamentAwardsService.getTournamentAwards(validatedTournamentId)

    return generateTournamentNarrative({
      tournament,
      standings,
      awards,
      matches,
    })
  }
}
