import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '@database'
import { assertNonEmptyString, nowIsoString, ValidationError } from '@modules/tournaments/tournament.validation'
import type {
  CreateTournamentPhaseInput,
  TournamentPhase,
  TournamentPhaseStatus,
  TournamentPhaseType,
} from '@shared/types/tournament-phase'
import {
  TOURNAMENT_PHASE_STATUSES,
  TOURNAMENT_PHASE_TYPES,
} from '@shared/types/tournament-phase'

interface TournamentPhaseRow {
  id: string
  tournament_id: string
  phase_type: string
  name: string
  order_index: number
  status: string
  created_at: string
  updated_at: string
}

export const TOURNAMENT_PHASE_SELECT_COLUMNS = `
  id, tournament_id, phase_type, name, order_index, status, created_at, updated_at
`.trim()

function assertPhaseType(value: unknown, field = 'phaseType'): TournamentPhaseType {
  if (typeof value !== 'string' || !TOURNAMENT_PHASE_TYPES.includes(value as TournamentPhaseType)) {
    throw new ValidationError(`${field} must be one of: ${TOURNAMENT_PHASE_TYPES.join(', ')}`)
  }

  return value as TournamentPhaseType
}

function assertPhaseStatus(value: unknown, field = 'status'): TournamentPhaseStatus {
  if (
    typeof value !== 'string' ||
    !TOURNAMENT_PHASE_STATUSES.includes(value as TournamentPhaseStatus)
  ) {
    throw new ValidationError(`${field} must be one of: ${TOURNAMENT_PHASE_STATUSES.join(', ')}`)
  }

  return value as TournamentPhaseStatus
}

function assertPositiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ValidationError(`${field} must be a positive integer`)
  }

  return value
}

function mapRowToTournamentPhase(row: TournamentPhaseRow): TournamentPhase {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    phaseType: row.phase_type as TournamentPhaseType,
    name: row.name,
    orderIndex: row.order_index,
    status: row.status as TournamentPhaseStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class TournamentPhaseRepository {
  constructor(private readonly db: Database.Database = getDatabase()) {}

  createPhase(input: CreateTournamentPhaseInput): TournamentPhase {
    const tournamentId = assertNonEmptyString(input.tournamentId, 'tournamentId')
    const phaseType = assertPhaseType(input.phaseType)
    const name = assertNonEmptyString(input.name, 'name')
    const orderIndex = assertPositiveInteger(input.orderIndex, 'orderIndex')
    const status = assertPhaseStatus(input.status)
    const id = randomUUID()
    const timestamp = nowIsoString()

    this.db
      .prepare(
        `INSERT INTO tournament_phases (
          id, tournament_id, phase_type, name, order_index, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, tournamentId, phaseType, name, orderIndex, status, timestamp, timestamp)

    return this.getPhaseById(id)!
  }

  getPhaseById(id: string): TournamentPhase | null {
    const phaseId = assertNonEmptyString(id, 'phaseId')
    const row = this.db
      .prepare(
        `SELECT ${TOURNAMENT_PHASE_SELECT_COLUMNS}
         FROM tournament_phases
         WHERE id = ?`,
      )
      .get(phaseId) as TournamentPhaseRow | undefined

    return row ? mapRowToTournamentPhase(row) : null
  }

  listPhasesByTournament(tournamentId: string): TournamentPhase[] {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const rows = this.db
      .prepare(
        `SELECT ${TOURNAMENT_PHASE_SELECT_COLUMNS}
         FROM tournament_phases
         WHERE tournament_id = ?
         ORDER BY order_index ASC, created_at ASC`,
      )
      .all(validatedTournamentId) as TournamentPhaseRow[]

    return rows.map(mapRowToTournamentPhase)
  }

  countPhasesByTournament(tournamentId: string): number {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const row = this.db
      .prepare(`SELECT COUNT(*) AS count FROM tournament_phases WHERE tournament_id = ?`)
      .get(validatedTournamentId) as { count: number }

    return row.count
  }

  updatePhaseStatus(phaseId: string, status: TournamentPhaseStatus): TournamentPhase {
    const validatedPhaseId = assertNonEmptyString(phaseId, 'phaseId')
    const validatedStatus = assertPhaseStatus(status)
    const existing = this.getPhaseById(validatedPhaseId)

    if (!existing) {
      throw new ValidationError(`Tournament phase not found: ${validatedPhaseId}`)
    }

    const updatedAt = nowIsoString()

    this.db
      .prepare(`UPDATE tournament_phases SET status = ?, updated_at = ? WHERE id = ?`)
      .run(validatedStatus, updatedAt, validatedPhaseId)

    return this.getPhaseById(validatedPhaseId)!
  }
}
