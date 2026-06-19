import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { ValidationError } from '../players/player.validation'
import { HeadToHeadStatsService } from './head-to-head-stats.service'

describe('HeadToHeadStatsService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let matchRepository: MatchRepository
  let headToHeadStatsService: HeadToHeadStatsService

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)
    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    matchRepository = new MatchRepository(db, tournamentRepository)
    headToHeadStatsService = new HeadToHeadStatsService(db)
  })

  afterEach(() => {
    db.close()
  })

  it('derives head-to-head stats from played matches between two players', () => {
    const alice = playerRepository.createPlayer({ name: 'Alice' })
    const bob = playerRepository.createPlayer({ name: 'Bob' })
    const tournament = tournamentRepository.createTournament({ name: 'Summer Cup' })

    tournamentRepository.addPlayersToTournament(tournament.id, [alice.id, bob.id])
    matchRepository.generateFixtureForTournament(tournament.id)

    const [match] = matchRepository.listMatchesByTournament({ tournamentId: tournament.id })
    matchRepository.updateMatchResult(match!.id, 2, 2)

    const stats = headToHeadStatsService.getHeadToHeadStats(alice.id, bob.id)

    expect(stats).toEqual({
      playerAId: alice.id,
      playerBId: bob.id,
      totalMatches: 1,
      playerAWins: 0,
      playerBWins: 0,
      draws: 1,
      playerAGoals: 2,
      playerBGoals: 2,
      lastMatches: [
        expect.objectContaining({
          tournamentName: 'Summer Cup',
          roundNumber: 1,
          playerAGoals: 2,
          playerBGoals: 2,
          winnerPlayerId: null,
        }),
      ],
    })
  })

  it('rejects identical player ids', () => {
    const alice = playerRepository.createPlayer({ name: 'Alice' })

    expect(() => headToHeadStatsService.getHeadToHeadStats(alice.id, alice.id)).toThrow(ValidationError)
  })
})
