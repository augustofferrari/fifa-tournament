import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { generateRoundRobinFixtures } from '../fixtures/round-robin.fixture'
import { MatchRepository } from './match.repository'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { PlayerRepository } from '../players/player.repository'
import { ValidationError } from '../tournaments/tournament.validation'
import { ValidationMessages } from '@shared/validation'

describe('MatchRepository.generateFixtureForTournament', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let matchRepository: MatchRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    matchRepository = new MatchRepository(db, tournamentRepository)
  })

  afterEach(() => {
    db.close()
  })

  function createTournamentWithPlayers(playerCount: number) {
    const playerIds = Array.from({ length: playerCount }, (_, index) =>
      playerRepository.createPlayer({ name: `Player ${index + 1}` }).id,
    )
    const tournament = tournamentRepository.createTournament({ name: 'Test Tournament' })
    tournamentRepository.addPlayersToTournament(tournament.id, playerIds)

    return { tournament, playerIds }
  }

  it('generates and persists round robin matches and activates the tournament', () => {
    const { tournament, playerIds } = createTournamentWithPlayers(4)
    const expectedFixtures = generateRoundRobinFixtures(playerIds)

    const matches = matchRepository.generateFixtureForTournament(tournament.id)

    expect(matches).toHaveLength(expectedFixtures.length)
    expect(matches.every((match) => match.status === 'scheduled')).toBe(true)
    expect(matches.every((match) => match.tournamentId === tournament.id)).toBe(true)

    const updatedTournament = tournamentRepository.getTournamentById(tournament.id)
    expect(updatedTournament?.status).toBe('active')

    const persistedMatches = matchRepository.listMatchesByTournament({
      tournamentId: tournament.id,
    })
    expect(persistedMatches).toHaveLength(expectedFixtures.length)
  })

  it('prevents generating fixture twice', () => {
    const { tournament } = createTournamentWithPlayers(4)

    matchRepository.generateFixtureForTournament(tournament.id)

    expect(() => matchRepository.generateFixtureForTournament(tournament.id)).toThrow(
      ValidationError,
    )
    expect(() => matchRepository.generateFixtureForTournament(tournament.id)).toThrow(
      ValidationMessages.fixtureAlreadyGenerated,
    )
  })

  it('prevents generating fixture for non-draft tournaments', () => {
    const { tournament } = createTournamentWithPlayers(4)

    tournamentRepository.updateTournamentStatus(tournament.id, 'active')

    expect(() => matchRepository.generateFixtureForTournament(tournament.id)).toThrow(
      'Fixture can only be generated for draft tournaments',
    )
  })
})

describe('MatchRepository.updateMatchResult', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let matchRepository: MatchRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    matchRepository = new MatchRepository(db, tournamentRepository)
  })

  afterEach(() => {
    db.close()
  })

  function createMatch() {
    const playerIds = ['p1', 'p2', 'p3', 'p4'].map((_, index) =>
      playerRepository.createPlayer({ name: `Player ${index + 1}` }).id,
    )
    const tournament = tournamentRepository.createTournament({ name: 'Test Tournament' })
    tournamentRepository.addPlayersToTournament(tournament.id, playerIds)
    const matches = matchRepository.generateFixtureForTournament(tournament.id)

    return matches[0]!
  }

  it('updates goals, sets status to played, and refreshes updated_at', () => {
    const match = createMatch()

    const updated = matchRepository.updateMatchResult(match.id, 2, 1)

    expect(updated.homeGoals).toBe(2)
    expect(updated.awayGoals).toBe(1)
    expect(updated.status).toBe('played')
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(match.updatedAt).getTime(),
    )

    const persisted = matchRepository.getMatchById(match.id)
    expect(persisted).toEqual(updated)
  })

  it('validates goals are non-negative integers', () => {
    const match = createMatch()

    expect(() => matchRepository.updateMatchResult(match.id, -1, 0)).toThrow(ValidationError)
    expect(() => matchRepository.updateMatchResult(match.id, -1, 0)).toThrow(
      ValidationMessages.goalsCannotBeNegative,
    )
    expect(() => matchRepository.updateMatchResult(match.id, 1.5, 0)).toThrow(ValidationError)
  })

  it('throws when match is not found', () => {
    expect(() => matchRepository.updateMatchResult('missing-id', 1, 0)).toThrow(
      'Match not found: missing-id',
    )
  })
})
