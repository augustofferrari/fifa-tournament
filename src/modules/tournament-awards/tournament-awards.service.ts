import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import { MatchRepository } from '@modules/matches/match.repository'
import { assertNonEmptyString, ValidationError } from '@modules/players/player.validation'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import type { TournamentAwards } from '@shared/types/tournament-awards'
import { calculateTournamentAwards } from './tournament-awards.calculator'

export class TournamentAwardsService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly matchRepository: MatchRepository = new MatchRepository(db, tournamentRepository),
  ) {}

  getTournamentAwards(tournamentId: string): TournamentAwards {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')

    if (!this.tournamentRepository.getTournamentById(validatedTournamentId)) {
      throw new ValidationError(`Tournament not found: ${validatedTournamentId}`)
    }

    const standings = this.tournamentRepository.getTournamentStandings(validatedTournamentId)
    const matches = this.matchRepository.listMatchesByTournament({
      tournamentId: validatedTournamentId,
    })

    return calculateTournamentAwards({
      tournamentId: validatedTournamentId,
      standings,
      matches,
    })
  }
}
