import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from './tournament.repository'
import { ValidationError } from './tournament.validation'
import { ValidationMessages } from '@shared/validation'
import { TournamentFormat } from '@shared/types/tournament-format'

describe('TournamentRepository validation', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  it('requires a tournament name', () => {
    expect(() => tournamentRepository.createTournament({ name: '  ' })).toThrow(ValidationError)
    expect(() => tournamentRepository.createTournament({ name: '  ' })).toThrow(
      ValidationMessages.tournamentNameRequired,
    )
  })

  it('requires at least 2 players when adding to a tournament', () => {
    const tournament = tournamentRepository.createTournament({ name: 'Copa' })
    const player = playerRepository.createPlayer({ name: 'Solo' })

    expect(() =>
      tournamentRepository.addPlayersToTournament(tournament.id, [player.id]),
    ).toThrow(ValidationMessages.tournamentMinPlayers)
  })

  it('requires at least 3 players for round robin plus playoffs tournaments', () => {
    const tournament = tournamentRepository.createTournament({
      name: 'Playoffs Cup',
      format: TournamentFormat.ROUND_ROBIN_PLAYOFFS,
      playoffQualifiedCount: 2,
    })
    const players = [
      playerRepository.createPlayer({ name: 'A' }),
      playerRepository.createPlayer({ name: 'B' }),
    ]

    expect(() =>
      tournamentRepository.addPlayersToTournament(
        tournament.id,
        players.map((player) => player.id),
      ),
    ).toThrow('requires at least 3 players')
  })

  it('requires at least 4 players for groups plus knockout tournaments', () => {
    const tournament = tournamentRepository.createTournament({
      name: 'Groups Cup',
      format: TournamentFormat.GROUPS_KNOCKOUT,
      groupCount: 2,
      playersPerGroup: 2,
      playoffQualifiedCount: 2,
    })
    const players = [
      playerRepository.createPlayer({ name: 'A' }),
      playerRepository.createPlayer({ name: 'B' }),
      playerRepository.createPlayer({ name: 'C' }),
    ]

    expect(() =>
      tournamentRepository.addPlayersToTournament(
        tournament.id,
        players.map((player) => player.id),
      ),
    ).toThrow('requires at least 4 players')
  })

  it('defaults new tournaments to ROUND_ROBIN format', () => {
    const tournament = tournamentRepository.createTournament({ name: 'League' })

    expect(tournament.format).toBe(TournamentFormat.ROUND_ROBIN)
    expect(tournament.hasGroupStage).toBe(false)
    expect(tournament.hasPlayoffs).toBe(false)
    expect(tournament.hasKnockoutStage).toBe(false)
    expect(tournament.playoffQualifiedCount).toBeNull()
    expect(tournament.groupCount).toBeNull()
    expect(tournament.playersPerGroup).toBeNull()
    expect(tournament.resultsUnlocked).toBe(false)
  })

  it('stores format-specific stage flags when creating a tournament', () => {
    const tournament = tournamentRepository.createTournament({
      name: 'Groups Cup',
      format: TournamentFormat.GROUPS_KNOCKOUT,
      groupCount: 4,
      playersPerGroup: 4,
      playoffQualifiedCount: 2,
    })

    expect(tournament.format).toBe(TournamentFormat.GROUPS_KNOCKOUT)
    expect(tournament.hasGroupStage).toBe(true)
    expect(tournament.hasPlayoffs).toBe(false)
    expect(tournament.hasKnockoutStage).toBe(true)
    expect(tournament.groupCount).toBe(4)
    expect(tournament.playersPerGroup).toBe(4)
    expect(tournament.playoffQualifiedCount).toBe(2)
  })

  it('keeps standings available after a player is deleted', () => {
    const tournamentPhaseService = new TournamentPhaseService(
      db,
      tournamentRepository,
      new TournamentPhaseRepository(db),
    )
    const matchRepository = new MatchRepository(db, tournamentRepository, tournamentPhaseService)
    const players = [
      playerRepository.createPlayer({ name: 'Alice' }),
      playerRepository.createPlayer({ name: 'Bob' }),
    ]
    const tournament = tournamentRepository.createTournament({ name: 'League' })
    tournamentRepository.addPlayersToTournament(
      tournament.id,
      players.map((player) => player.id),
    )
    matchRepository.generateFixtureForTournament(tournament.id)
    const [firstMatch] = matchRepository.listMatchesByTournament({ tournamentId: tournament.id })
    matchRepository.updateMatchResult(firstMatch!.id, 2, 1)

    playerRepository.deletePlayer(players[0]!.id)

    const standings = tournamentRepository.getTournamentStandings(tournament.id)
    const removedPlayerStanding = standings.find((row) => row.playerName === ValidationMessages.removedPlayer)

    expect(removedPlayerStanding).toBeDefined()
    expect(matchRepository.listMatchesByTournament({ tournamentId: tournament.id })).toHaveLength(1)
  })
})
