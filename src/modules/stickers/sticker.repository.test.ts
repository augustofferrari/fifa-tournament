import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { PlayerRepository } from '../players/player.repository'
import { StickerRepository } from './sticker.repository'
import { ValidationError } from './sticker.validation'

describe('StickerRepository', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let stickerRepository: StickerRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    playerRepository = new PlayerRepository(db)
    stickerRepository = new StickerRepository(db, playerRepository)
  })

  afterEach(() => {
    db.close()
  })

  it('creates, updates, and lists stickers', () => {
    const player = playerRepository.createPlayer({ name: 'Lionel' })

    const created = stickerRepository.createSticker({
      playerId: player.id,
      theme: 'world-cup',
      generatedImagePath: '/images/sticker.png',
      rating: 95,
      position: 'FW',
    })

    expect(created).toMatchObject({
      playerId: player.id,
      theme: 'world-cup',
      generatedImagePath: '/images/sticker.png',
      rating: 95,
      position: 'FW',
    })

    const updated = stickerRepository.updateSticker(created.id, {
      rating: 97,
      position: 'ST',
    })

    expect(updated.rating).toBe(97)
    expect(updated.position).toBe('ST')

    const byPlayer = stickerRepository.getStickerByPlayerId(player.id)
    expect(byPlayer).toHaveLength(1)
    expect(byPlayer[0]?.id).toBe(created.id)

    const listed = stickerRepository.listStickers({ theme: 'world-cup' })
    expect(listed).toHaveLength(1)
  })

  it('rejects duplicate player and theme combinations', () => {
    const player = playerRepository.createPlayer({ name: 'Lionel' })

    stickerRepository.createSticker({
      playerId: player.id,
      theme: 'world-cup',
    })

    expect(() =>
      stickerRepository.createSticker({
        playerId: player.id,
        theme: 'world-cup',
      }),
    ).toThrow(ValidationError)
  })

  it('rejects stickers for missing players', () => {
    expect(() =>
      stickerRepository.createSticker({
        playerId: 'missing-player',
        theme: 'world-cup',
      }),
    ).toThrow('Player not found: missing-player')
  })

  it('upserts exported sticker metadata', () => {
    const player = playerRepository.createPlayer({ name: 'Lionel' })

    const created = stickerRepository.saveExportedSticker({
      playerId: player.id,
      theme: 'world-cup',
      generatedImagePath: '/tmp/sticker-a.png',
      rating: 95,
      position: 'ST',
    })

    const updated = stickerRepository.saveExportedSticker({
      playerId: player.id,
      theme: 'world-cup',
      generatedImagePath: '/tmp/sticker-b.png',
      rating: 97,
      position: 'CF',
    })

    expect(updated.id).toBe(created.id)
    expect(updated.generatedImagePath).toBe('/tmp/sticker-b.png')
    expect(updated.rating).toBe(97)
    expect(updated.position).toBe('CF')
  })
})
