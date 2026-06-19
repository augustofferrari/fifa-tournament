import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { HistoricalStatsRepository } from './historical-stats.repository'

describe('HistoricalStatsRepository', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let matchRepository: MatchRepository
  let historicalStatsRepository: HistoricalStatsRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)
    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    matchRepository = new MatchRepository(db, tournamentRepository)
    historicalStatsRepository = new HistoricalStatsRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  it('derives global stats from players, tournament_players and matches tables', () => {
    const alice = playerRepository.createPlayer({ name: 'Alice' })
    const bob = playerRepository.createPlayer({ name: 'Bob' })
    const tournament = tournamentRepository.createTournament({ name: 'World Cup' })

    tournamentRepository.addPlayersToTournament(tournament.id, [alice.id, bob.id])
    matchRepository.generateFixtureForTournament(tournament.id)

    const [match] = matchRepository.listMatchesByTournament({ tournamentId: tournament.id })
    matchRepository.updateMatchResult(match!.id, 2, 0)

    const result = historicalStatsRepository.getGlobalPlayerStats()

    expect(result.players).toEqual([
      expect.objectContaining({
        playerId: alice.id,
        playerName: 'Alice',
        tournamentsPlayed: 1,
        tournamentsWon: 1,
        matchesPlayed: 1,
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        goalDifference: 2,
        points: 3,
        winRate: 1,
      }),
      expect.objectContaining({
        playerId: bob.id,
        playerName: 'Bob',
        tournamentsPlayed: 1,
        tournamentsWon: 0,
        matchesPlayed: 1,
        wins: 0,
        draws: 0,
        losses: 1,
        goalsFor: 0,
        goalsAgainst: 2,
        goalDifference: -2,
        points: 0,
        winRate: 0,
      }),
    ])
  })
})
