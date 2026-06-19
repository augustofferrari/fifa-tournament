import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { TournamentRepository } from './tournament.repository'
import { ValidationError } from './tournament.validation'
import { ValidationMessages } from '@shared/validation'

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

  it('keeps standings available after a player is deleted', () => {
    const matchRepository = new MatchRepository(db, tournamentRepository)
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
