import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { generateRoundRobinFixtures } from '../fixtures/round-robin.fixture'
import { MatchRepository } from './match.repository'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { PlayerRepository } from '../players/player.repository'
import { ValidationError } from '../tournaments/tournament.validation'
import { ValidationMessages } from '@shared/validation'

function createMatchRepository(db: Database.Database) {
  const tournamentRepository = new TournamentRepository(db)
  const tournamentPhaseService = new TournamentPhaseService(
    db,
    tournamentRepository,
    new TournamentPhaseRepository(db),
  )

  return new MatchRepository(db, tournamentRepository, tournamentPhaseService)
}

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
    matchRepository = createMatchRepository(db)
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
    expect(matches.every((match) => match.phaseId !== null)).toBe(true)

    const phases = db
      .prepare(`SELECT phase_type, status FROM tournament_phases WHERE tournament_id = ?`)
      .all(tournament.id) as Array<{ phase_type: string; status: string }>

    expect(phases).toHaveLength(1)
    expect(phases[0]?.phase_type).toBe('ROUND_ROBIN')
    expect(phases[0]?.status).toBe('active')

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
    matchRepository = createMatchRepository(db)
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

describe('MatchRepository.getLatestResults', () => {
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
    matchRepository = createMatchRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  function createPlayedMatch(
    tournamentName: string,
    homeName: string,
    awayName: string,
    homeGoals: number,
    awayGoals: number,
  ) {
    const home = playerRepository.createPlayer({ name: homeName })
    const away = playerRepository.createPlayer({ name: awayName })
    const tournament = tournamentRepository.createTournament({ name: tournamentName })
    tournamentRepository.addPlayersToTournament(tournament.id, [home.id, away.id, home.id, away.id].slice(0, 2))
    const players = [home.id, away.id]
    tournamentRepository.addPlayersToTournament(tournament.id, players)
    const matches = matchRepository.generateFixtureForTournament(tournament.id)
    return matchRepository.updateMatchResult(matches[0]!.id, homeGoals, awayGoals)
  }

  it('returns played matches ordered by most recently updated', () => {
    const playerIds = ['Alice', 'Bob', 'Carol', 'Dave'].map((name) =>
      playerRepository.createPlayer({ name }).id,
    )

    const tournamentA = tournamentRepository.createTournament({ name: 'Summer Cup' })
    tournamentRepository.addPlayersToTournament(tournamentA.id, playerIds)
    const tournamentAMatches = matchRepository.generateFixtureForTournament(tournamentA.id)
    matchRepository.updateMatchResult(tournamentAMatches[0]!.id, 2, 1)

    const tournamentB = tournamentRepository.createTournament({ name: 'Winter League' })
    tournamentRepository.addPlayersToTournament(tournamentB.id, playerIds)
    const tournamentBMatches = matchRepository.generateFixtureForTournament(tournamentB.id)
    const latestMatch = matchRepository.updateMatchResult(tournamentBMatches[0]!.id, 3, 0)

    const results = matchRepository.getLatestResults(5)

    expect(results).toHaveLength(2)
    expect(results[0]?.matchId).toBe(latestMatch.id)
    expect(results[0]?.tournamentName).toBe('Winter League')
    expect(results[0]?.homeGoals).toBe(3)
    expect(results[0]?.awayGoals).toBe(0)
    expect(results[0]?.playedAt).toBe(latestMatch.updatedAt)
  })

  it('defaults to 5 results and respects the limit', () => {
    const playerIds = ['Alice', 'Bob', 'Carol', 'Dave'].map((name) =>
      playerRepository.createPlayer({ name }).id,
    )
    const tournament = tournamentRepository.createTournament({ name: 'Busy Season' })
    tournamentRepository.addPlayersToTournament(tournament.id, playerIds)
    const matches = matchRepository.generateFixtureForTournament(tournament.id)

    for (const match of matches.slice(0, 3)) {
      matchRepository.updateMatchResult(match.id, 1, 0)
    }

    expect(matchRepository.getLatestResults()).toHaveLength(3)
    expect(matchRepository.getLatestResults(2)).toHaveLength(2)
  })

  it('uses removed player label when a player was deleted', () => {
    const home = playerRepository.createPlayer({ name: 'Alice' })
    const away = playerRepository.createPlayer({ name: 'Bob' })
    const extra = playerRepository.createPlayer({ name: 'Carol' })
    const fourth = playerRepository.createPlayer({ name: 'Dave' })
    const tournament = tournamentRepository.createTournament({ name: 'Open Cup' })
    tournamentRepository.addPlayersToTournament(tournament.id, [
      home.id,
      away.id,
      extra.id,
      fourth.id,
    ])
    const matches = matchRepository.generateFixtureForTournament(tournament.id)
    matchRepository.updateMatchResult(matches[0]!.id, 2, 2)
    playerRepository.deletePlayer(home.id)

    const [result] = matchRepository.getLatestResults(1)

    expect(result?.homePlayerName).toBe(ValidationMessages.removedPlayer)
    expect(result?.awayPlayerName).toBe('Bob')
  })

  it('validates limit', () => {
    expect(() => matchRepository.getLatestResults(0)).toThrow(ValidationError)
    expect(() => matchRepository.getLatestResults(-1)).toThrow(ValidationError)
    expect(() => matchRepository.getLatestResults(51)).toThrow(ValidationError)
  })
})
