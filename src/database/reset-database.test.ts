import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runMigrations } from './migrations/runner'
import { migrations } from './migrations'
import * as database from './index'
import { clearAllApplicationData } from './reset-database'
import { PlayerRepository } from '../modules/players/player.repository'
import { StickerRepository } from '../modules/stickers/sticker.repository'
import { TournamentRepository } from '../modules/tournaments/tournament.repository'

describe('clearAllApplicationData', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let stickerRepository: StickerRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    runMigrations(db, migrations)
    vi.spyOn(database, 'getDatabase').mockReturnValue(db)

    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    stickerRepository = new StickerRepository(db, playerRepository)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    db.close()
  })

  it('removes all application data while keeping the schema and migrations table', () => {
    const players = [
      playerRepository.createPlayer({ name: 'Alice' }),
      playerRepository.createPlayer({ name: 'Bob' }),
    ]
    const tournament = tournamentRepository.createTournament({ name: 'World Cup' })
    tournamentRepository.addPlayersToTournament(
      tournament.id,
      players.map((player) => player.id),
    )
    stickerRepository.createSticker({
      playerId: players[0]!.id,
      theme: 'world-cup',
    })

    const migrationCountBeforeReset = (
      db.prepare('SELECT COUNT(*) AS count FROM _migrations').get() as { count: number }
    ).count

    clearAllApplicationData(db)

    expect(db.prepare('SELECT COUNT(*) AS count FROM players').get()).toEqual({ count: 0 })
    expect(db.prepare('SELECT COUNT(*) AS count FROM tournaments').get()).toEqual({ count: 0 })
    expect(db.prepare('SELECT COUNT(*) AS count FROM stickers').get()).toEqual({ count: 0 })
    expect(db.prepare('SELECT COUNT(*) AS count FROM _migrations').get()).toEqual({
      count: migrationCountBeforeReset,
    })
  })
})
