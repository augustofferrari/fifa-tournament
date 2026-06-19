import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { TournamentAwardsService } from './tournament-awards.service'

describe('TournamentAwardsService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let matchRepository: MatchRepository
  let tournamentAwardsService: TournamentAwardsService

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)
    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    matchRepository = new MatchRepository(db, tournamentRepository)
    tournamentAwardsService = new TournamentAwardsService(db, tournamentRepository, matchRepository)
  })

  afterEach(() => {
    db.close()
  })

  it('derives awards from tournament standings and played matches', () => {
    const alice = playerRepository.createPlayer({ name: 'Alice' })
    const bob = playerRepository.createPlayer({ name: 'Bob' })
    const tournament = tournamentRepository.createTournament({ name: 'Finals' })

    tournamentRepository.addPlayersToTournament(tournament.id, [alice.id, bob.id])
    matchRepository.generateFixtureForTournament(tournament.id)

    const [match] = matchRepository.listMatchesByTournament({ tournamentId: tournament.id })
    matchRepository.updateMatchResult(match!.id, 3, 1)

    const awards = tournamentAwardsService.getTournamentAwards(tournament.id)

    expect(awards).toEqual({
      tournamentId: tournament.id,
      champion: { playerId: alice.id, playerName: 'Alice' },
      runnerUp: { playerId: bob.id, playerName: 'Bob' },
      topScorer: { playerId: alice.id, playerName: 'Alice' },
      bestDefense: { playerId: alice.id, playerName: 'Alice' },
      mostWins: { playerId: alice.id, playerName: 'Alice' },
      biggestWin: expect.objectContaining({
        matchId: match!.id,
        winnerPlayerId: alice.id,
        loserPlayerId: bob.id,
        winnerGoals: 3,
        loserGoals: 1,
        goalDifference: 2,
      }),
    })
  })

  it('throws when the tournament does not exist', () => {
    expect(() => tournamentAwardsService.getTournamentAwards('missing-id')).toThrow(
      'Tournament not found: missing-id',
    )
  })
})
