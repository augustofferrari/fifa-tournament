import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '@database'
import type {
  CreatePlayerInput,
  ListPlayersOptions,
  Player,
  UpdatePlayerInput,
} from '@shared/types/player'
import {
  assertNonEmptyString,
  assertPlayerName,
  normalizeOptionalString,
  nowIsoString,
  ValidationError,
} from './player.validation'
import { createValidationError } from '@shared/validation/errors'

interface PlayerRow {
  id: string
  name: string
  nickname: string | null
  team_name: string | null
  photo_path: string | null
  created_at: string
  updated_at: string
}

function mapRowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname,
    teamName: row.team_name,
    photoPath: row.photo_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function validateCreateInput(input: CreatePlayerInput): CreatePlayerInput {
  return {
    name: assertPlayerName(input.name),
    nickname: normalizeOptionalString(input.nickname),
    teamName: normalizeOptionalString(input.teamName),
    photoPath: normalizeOptionalString(input.photoPath),
  }
}

function validateUpdateInput(input: UpdatePlayerInput): UpdatePlayerInput {
  const hasUpdates =
    input.name !== undefined ||
    input.nickname !== undefined ||
    input.teamName !== undefined ||
    input.photoPath !== undefined

  if (!hasUpdates) {
    throw new ValidationError('At least one field is required to update a player')
  }

  const validated: UpdatePlayerInput = {}

  if (input.name !== undefined) {
    validated.name = assertPlayerName(input.name)
  }

  if (input.nickname !== undefined) {
    validated.nickname = normalizeOptionalString(input.nickname)
  }

  if (input.teamName !== undefined) {
    validated.teamName = normalizeOptionalString(input.teamName)
  }

  if (input.photoPath !== undefined) {
    validated.photoPath = normalizeOptionalString(input.photoPath)
  }

  return validated
}

export class PlayerRepository {
  constructor(private readonly db: Database.Database = getDatabase()) {}

  createPlayer(input: CreatePlayerInput): Player {
    const validated = validateCreateInput(input)
    const id = randomUUID()
    const timestamp = nowIsoString()

    this.db
      .prepare(
        `INSERT INTO players (
          id, name, nickname, team_name, photo_path, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        validated.name,
        validated.nickname ?? null,
        validated.teamName ?? null,
        validated.photoPath ?? null,
        timestamp,
        timestamp,
      )

    return this.getPlayerById(id)!
  }

  updatePlayer(id: string, input: UpdatePlayerInput): Player {
    const playerId = assertNonEmptyString(id, 'id')
    const validated = validateUpdateInput(input)
    const existing = this.getPlayerById(playerId)

    if (!existing) {
      throw createValidationError('errors.playerNotFound', { id: playerId })
    }

    const updatedAt = nowIsoString()
    const fields: string[] = []
    const values: Array<string | null> = []

    if (validated.name !== undefined) {
      fields.push('name = ?')
      values.push(validated.name)
    }

    if (validated.nickname !== undefined) {
      fields.push('nickname = ?')
      values.push(validated.nickname)
    }

    if (validated.teamName !== undefined) {
      fields.push('team_name = ?')
      values.push(validated.teamName)
    }

    if (validated.photoPath !== undefined) {
      fields.push('photo_path = ?')
      values.push(validated.photoPath)
    }

    fields.push('updated_at = ?')
    values.push(updatedAt)
    values.push(playerId)

    this.db
      .prepare(`UPDATE players SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values)

    return this.getPlayerById(playerId)!
  }

  deletePlayer(id: string): boolean {
    const playerId = assertNonEmptyString(id, 'id')
    const result = this.db.prepare('DELETE FROM players WHERE id = ?').run(playerId)
    return result.changes > 0
  }

  getPlayerById(id: string): Player | null {
    const playerId = assertNonEmptyString(id, 'id')
    const row = this.db
      .prepare(
        `SELECT id, name, nickname, team_name, photo_path, created_at, updated_at
         FROM players
         WHERE id = ?`,
      )
      .get(playerId) as PlayerRow | undefined

    return row ? mapRowToPlayer(row) : null
  }

  listPlayers(options: ListPlayersOptions = {}): Player[] {
    const teamName = options.teamName
      ? normalizeOptionalString(options.teamName)
      : undefined

    if (teamName) {
      const rows = this.db
        .prepare(
          `SELECT id, name, nickname, team_name, photo_path, created_at, updated_at
           FROM players
           WHERE team_name = ?
           ORDER BY name COLLATE NOCASE ASC`,
        )
        .all(teamName) as PlayerRow[]

      return rows.map(mapRowToPlayer)
    }

    const rows = this.db
      .prepare(
        `SELECT id, name, nickname, team_name, photo_path, created_at, updated_at
         FROM players
         ORDER BY name COLLATE NOCASE ASC`,
      )
      .all() as PlayerRow[]

    return rows.map(mapRowToPlayer)
  }
}
