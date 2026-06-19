import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '@database'
import { assertNonEmptyString, nowIsoString, ValidationError } from '@modules/tournaments/tournament.validation'
import type {
  CreateTournamentGroupInput,
  CreateTournamentGroupPlayerInput,
  TournamentGroup,
  TournamentGroupPlayer,
} from '@shared/types/tournament-group'

interface TournamentGroupRow {
  id: string
  tournament_id: string
  phase_id: string
  name: string
  order_index: number
  created_at: string
  updated_at: string
}

interface TournamentGroupPlayerRow {
  id: string
  group_id: string
  player_id: string
  seed_position: number | null
  created_at: string
}

export const TOURNAMENT_GROUP_SELECT_COLUMNS = `
  id, tournament_id, phase_id, name, order_index, created_at, updated_at
`.trim()

function assertPositiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ValidationError(`${field} must be a positive integer`)
  }

  return value
}

function mapRowToTournamentGroup(row: TournamentGroupRow): TournamentGroup {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    phaseId: row.phase_id,
    name: row.name,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRowToTournamentGroupPlayer(row: TournamentGroupPlayerRow): TournamentGroupPlayer {
  return {
    id: row.id,
    groupId: row.group_id,
    playerId: row.player_id,
    seedPosition: row.seed_position,
    createdAt: row.created_at,
  }
}

export class TournamentGroupRepository {
  constructor(private readonly db: Database.Database = getDatabase()) {}

  createGroup(input: CreateTournamentGroupInput): TournamentGroup {
    const tournamentId = assertNonEmptyString(input.tournamentId, 'tournamentId')
    const phaseId = assertNonEmptyString(input.phaseId, 'phaseId')
    const name = assertNonEmptyString(input.name, 'name')
    const orderIndex = assertPositiveInteger(input.orderIndex, 'orderIndex')
    const id = randomUUID()
    const timestamp = nowIsoString()

    this.db
      .prepare(
        `INSERT INTO tournament_groups (
          id, tournament_id, phase_id, name, order_index, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, tournamentId, phaseId, name, orderIndex, timestamp, timestamp)

    return this.getGroupById(id)!
  }

  addPlayerToGroup(input: CreateTournamentGroupPlayerInput): TournamentGroupPlayer {
    const groupId = assertNonEmptyString(input.groupId, 'groupId')
    const playerId = assertNonEmptyString(input.playerId, 'playerId')
    const seedPosition = assertPositiveInteger(input.seedPosition, 'seedPosition')
    const id = randomUUID()
    const timestamp = nowIsoString()

    if (!this.getGroupById(groupId)) {
      throw new ValidationError(`Tournament group not found: ${groupId}`)
    }

    this.db
      .prepare(
        `INSERT INTO tournament_group_players (id, group_id, player_id, seed_position, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, groupId, playerId, seedPosition, timestamp)

    return this.getGroupPlayerById(id)!
  }

  getGroupById(id: string): TournamentGroup | null {
    const groupId = assertNonEmptyString(id, 'groupId')
    const row = this.db
      .prepare(
        `SELECT ${TOURNAMENT_GROUP_SELECT_COLUMNS}
         FROM tournament_groups
         WHERE id = ?`,
      )
      .get(groupId) as TournamentGroupRow | undefined

    return row ? mapRowToTournamentGroup(row) : null
  }

  getGroupPlayerById(id: string): TournamentGroupPlayer | null {
    const groupPlayerId = assertNonEmptyString(id, 'groupPlayerId')
    const row = this.db
      .prepare(
        `SELECT id, group_id, player_id, seed_position, created_at
         FROM tournament_group_players
         WHERE id = ?`,
      )
      .get(groupPlayerId) as TournamentGroupPlayerRow | undefined

    return row ? mapRowToTournamentGroupPlayer(row) : null
  }

  countGroupsByPhase(phaseId: string): number {
    const validatedPhaseId = assertNonEmptyString(phaseId, 'phaseId')
    const row = this.db
      .prepare(`SELECT COUNT(*) AS count FROM tournament_groups WHERE phase_id = ?`)
      .get(validatedPhaseId) as { count: number }

    return row.count
  }

  listGroupsByPhase(phaseId: string): TournamentGroup[] {
    const validatedPhaseId = assertNonEmptyString(phaseId, 'phaseId')
    const rows = this.db
      .prepare(
        `SELECT ${TOURNAMENT_GROUP_SELECT_COLUMNS}
         FROM tournament_groups
         WHERE phase_id = ?
         ORDER BY order_index ASC, created_at ASC`,
      )
      .all(validatedPhaseId) as TournamentGroupRow[]

    return rows.map(mapRowToTournamentGroup)
  }

  listGroupPlayersByGroupId(groupId: string): TournamentGroupPlayer[] {
    const validatedGroupId = assertNonEmptyString(groupId, 'groupId')
    const rows = this.db
      .prepare(
        `SELECT id, group_id, player_id, seed_position, created_at
         FROM tournament_group_players
         WHERE group_id = ?
         ORDER BY seed_position ASC, created_at ASC`,
      )
      .all(validatedGroupId) as TournamentGroupPlayerRow[]

    return rows.map(mapRowToTournamentGroupPlayer)
  }
}
