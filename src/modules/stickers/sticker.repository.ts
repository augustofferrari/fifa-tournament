import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '@database'
import { PlayerRepository } from '@modules/players/player.repository'
import type {
  CreateStickerInput,
  ListStickersOptions,
  SaveExportedStickerInput,
  Sticker,
  UpdateStickerInput,
} from '@shared/types/sticker'
import {
  assertNonEmptyString,
  normalizeOptionalRating,
  normalizeOptionalString,
  nowIsoString,
  ValidationError,
} from './sticker.validation'

interface StickerRow {
  id: string
  player_id: string
  theme: string
  generated_image_path: string | null
  rating: number | null
  position: string | null
  created_at: string
}

function mapRowToSticker(row: StickerRow): Sticker {
  return {
    id: row.id,
    playerId: row.player_id,
    theme: row.theme,
    generatedImagePath: row.generated_image_path,
    rating: row.rating,
    position: row.position,
    createdAt: row.created_at,
  }
}

function validateCreateInput(input: CreateStickerInput): CreateStickerInput {
  return {
    playerId: assertNonEmptyString(input.playerId, 'playerId'),
    theme: assertNonEmptyString(input.theme, 'theme'),
    generatedImagePath: normalizeOptionalString(input.generatedImagePath),
    rating: normalizeOptionalRating(input.rating),
    position: normalizeOptionalString(input.position),
  }
}

function validateUpdateInput(input: UpdateStickerInput): UpdateStickerInput {
  const hasUpdates =
    input.theme !== undefined ||
    input.generatedImagePath !== undefined ||
    input.rating !== undefined ||
    input.position !== undefined

  if (!hasUpdates) {
    throw new ValidationError('At least one field is required to update a sticker')
  }

  const validated: UpdateStickerInput = {}

  if (input.theme !== undefined) {
    validated.theme = assertNonEmptyString(input.theme, 'theme')
  }

  if (input.generatedImagePath !== undefined) {
    validated.generatedImagePath = normalizeOptionalString(input.generatedImagePath)
  }

  if (input.rating !== undefined) {
    validated.rating = normalizeOptionalRating(input.rating)
  }

  if (input.position !== undefined) {
    validated.position = normalizeOptionalString(input.position)
  }

  return validated
}

export class StickerRepository {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly playerRepository: PlayerRepository = new PlayerRepository(db),
  ) {}

  createSticker(input: CreateStickerInput): Sticker {
    const validated = validateCreateInput(input)

    if (!this.playerRepository.getPlayerById(validated.playerId)) {
      throw new ValidationError(`Player not found: ${validated.playerId}`)
    }

    if (this.findStickerByPlayerAndTheme(validated.playerId, validated.theme)) {
      throw new ValidationError(
        `Sticker already exists for player ${validated.playerId} with theme ${validated.theme}`,
      )
    }

    const id = randomUUID()
    const createdAt = nowIsoString()

    this.db
      .prepare(
        `INSERT INTO stickers (
          id, player_id, theme, generated_image_path, rating, position, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        validated.playerId,
        validated.theme,
        validated.generatedImagePath ?? null,
        validated.rating ?? null,
        validated.position ?? null,
        createdAt,
      )

    return this.getStickerById(id)!
  }

  updateSticker(id: string, input: UpdateStickerInput): Sticker {
    const stickerId = assertNonEmptyString(id, 'id')
    const validated = validateUpdateInput(input)
    const existing = this.getStickerById(stickerId)

    if (!existing) {
      throw new ValidationError(`Sticker not found: ${stickerId}`)
    }

    if (validated.theme !== undefined && validated.theme !== existing.theme) {
      if (this.findStickerByPlayerAndTheme(existing.playerId, validated.theme, stickerId)) {
        throw new ValidationError(
          `Sticker already exists for player ${existing.playerId} with theme ${validated.theme}`,
        )
      }
    }

    const fields: string[] = []
    const values: Array<string | number | null> = []

    if (validated.theme !== undefined) {
      fields.push('theme = ?')
      values.push(validated.theme)
    }

    if (validated.generatedImagePath !== undefined) {
      fields.push('generated_image_path = ?')
      values.push(validated.generatedImagePath)
    }

    if (validated.rating !== undefined) {
      fields.push('rating = ?')
      values.push(validated.rating)
    }

    if (validated.position !== undefined) {
      fields.push('position = ?')
      values.push(validated.position)
    }

    values.push(stickerId)

    this.db
      .prepare(`UPDATE stickers SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values)

    return this.getStickerById(stickerId)!
  }

  getStickerByPlayerId(playerId: string): Sticker[] {
    const validatedPlayerId = assertNonEmptyString(playerId, 'playerId')

    if (!this.playerRepository.getPlayerById(validatedPlayerId)) {
      throw new ValidationError(`Player not found: ${validatedPlayerId}`)
    }

    const rows = this.db
      .prepare(
        `SELECT id, player_id, theme, generated_image_path, rating, position, created_at
         FROM stickers
         WHERE player_id = ?
         ORDER BY created_at DESC`,
      )
      .all(validatedPlayerId) as StickerRow[]

    return rows.map(mapRowToSticker)
  }

  listStickers(options: ListStickersOptions = {}): Sticker[] {
    const conditions: string[] = []
    const values: string[] = []

    if (options.playerId !== undefined) {
      conditions.push('player_id = ?')
      values.push(assertNonEmptyString(options.playerId, 'playerId'))
    }

    if (options.theme !== undefined) {
      conditions.push('theme = ?')
      values.push(assertNonEmptyString(options.theme, 'theme'))
    }

    if (options.position !== undefined) {
      conditions.push('position = ?')
      values.push(assertNonEmptyString(options.position, 'position'))
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const rows = this.db
      .prepare(
        `SELECT id, player_id, theme, generated_image_path, rating, position, created_at
         FROM stickers
         ${whereClause}
         ORDER BY created_at DESC`,
      )
      .all(...values) as StickerRow[]

    return rows.map(mapRowToSticker)
  }

  saveExportedSticker(input: SaveExportedStickerInput): Sticker {
    const validated = validateCreateInput({
      playerId: input.playerId,
      theme: input.theme,
      generatedImagePath: input.generatedImagePath,
      rating: input.rating,
      position: input.position,
    })

    if (!this.playerRepository.getPlayerById(validated.playerId)) {
      throw new ValidationError(`Player not found: ${validated.playerId}`)
    }

    const existing = this.findStickerByPlayerAndTheme(validated.playerId, validated.theme)

    if (existing) {
      return this.updateSticker(existing.id, {
        generatedImagePath: validated.generatedImagePath ?? null,
        rating: validated.rating,
        position: validated.position,
      })
    }

    return this.createSticker(validated)
  }

  private getStickerById(id: string): Sticker | null {
    const row = this.db
      .prepare(
        `SELECT id, player_id, theme, generated_image_path, rating, position, created_at
         FROM stickers
         WHERE id = ?`,
      )
      .get(id) as StickerRow | undefined

    return row ? mapRowToSticker(row) : null
  }

  private findStickerByPlayerAndTheme(
    playerId: string,
    theme: string,
    excludeId?: string,
  ): Sticker | null {
    const row = this.db
      .prepare(
        `SELECT id, player_id, theme, generated_image_path, rating, position, created_at
         FROM stickers
         WHERE player_id = ? AND theme = ?`,
      )
      .get(playerId, theme) as StickerRow | undefined

    if (!row) {
      return null
    }

    if (excludeId && row.id === excludeId) {
      return null
    }

    return mapRowToSticker(row)
  }
}
