import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { PlayerRepository } from './player.repository'
import { ValidationError } from './player.validation'
import { ValidationMessages } from '@shared/validation'
import { translate } from '@shared/i18n'

describe('PlayerRepository validation', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)
    playerRepository = new PlayerRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  it('requires a player name', () => {
    expect(() => playerRepository.createPlayer({ name: '   ' })).toThrow(ValidationError)
    expect(() => playerRepository.createPlayer({ name: '   ' })).toThrow(
      translate(ValidationMessages.playerNameRequired, 'en'),
    )
  })

  it('allows deleting a player referenced by existing matches', () => {
    const tournamentRepository = new TournamentRepository(db)
    const matchRepository = new MatchRepository(db, tournamentRepository)
    const players = [
      playerRepository.createPlayer({ name: 'Alice' }),
      playerRepository.createPlayer({ name: 'Bob' }),
    ]
    const tournament = tournamentRepository.createTournament({ name: 'Cup' })
    tournamentRepository.addPlayersToTournament(
      tournament.id,
      players.map((player) => player.id),
    )
    matchRepository.generateFixtureForTournament(tournament.id)

    expect(playerRepository.deletePlayer(players[0]!.id)).toBe(true)
    expect(playerRepository.getPlayerById(players[0]!.id)).toBeNull()
    expect(matchRepository.listMatchesByTournament({ tournamentId: tournament.id })).toHaveLength(1)
  })
})
