import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { PlayerStreakService } from './player-streaks.service'

function createMatchRepository(db: Database.Database, tournamentRepository: TournamentRepository) {
  const tournamentPhaseService = new TournamentPhaseService(
    db,
    tournamentRepository,
    new TournamentPhaseRepository(db),
  )

  return new MatchRepository(db, tournamentRepository, tournamentPhaseService)
}

describe('PlayerStreakService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let matchRepository: MatchRepository
  let playerStreakService: PlayerStreakService

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)
    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    matchRepository = createMatchRepository(db, tournamentRepository)
    playerStreakService = new PlayerStreakService(db, playerRepository)
  })

  afterEach(() => {
    db.close()
  })

  it('calculates streaks from played matches ordered by updated_at', () => {
    const alice = playerRepository.createPlayer({ name: 'Alice' })
    const bob = playerRepository.createPlayer({ name: 'Bob' })
    const charlie = playerRepository.createPlayer({ name: 'Charlie' })
    const tournament = tournamentRepository.createTournament({ name: 'Cup' })

    tournamentRepository.addPlayersToTournament(tournament.id, [alice.id, bob.id, charlie.id])
    matchRepository.generateFixtureForTournament(tournament.id)

    const aliceMatches = matchRepository
      .listMatchesByTournament({ tournamentId: tournament.id })
      .filter((match) => match.homePlayerId === alice.id || match.awayPlayerId === alice.id)
      .sort((a, b) => a.roundNumber - b.roundNumber)

    matchRepository.updateMatchResult(aliceMatches[0]!.id, 2, 0)
    matchRepository.updateMatchResult(aliceMatches[1]!.id, 1, 1)

    const streaks = playerStreakService.getPlayerStreaks(alice.id)

    expect(streaks).toEqual({
      playerId: alice.id,
      currentWinStreak: 0,
      currentUnbeatenStreak: 2,
      currentLosingStreak: 0,
      bestWinStreak: 1,
      bestUnbeatenStreak: 2,
    })
  })

  it('throws when the player does not exist', () => {
    expect(() => playerStreakService.getPlayerStreaks('missing-id')).toThrow(
      'Player not found: missing-id',
    )
  })
})
