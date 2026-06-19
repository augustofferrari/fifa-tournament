import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '@database'
import { assertNonEmptyString, nowIsoString, ValidationError } from '@modules/tournaments/tournament.validation'
import type { BracketMatch } from '@shared/types/bracket-match'
import {
  BracketNextMatchSlot,
  BracketRound,
  BracketSourceType,
} from '@shared/types/bracket-match'
import type { CreateBracketMatchInput } from '@shared/types/bracket-match'

interface BracketMatchRow {
  id: string
  tournament_id: string
  phase_id: string
  match_id: string | null
  bracket_round: string
  bracket_position: number
  home_source_type: string
  home_source_ref: string | null
  away_source_type: string
  away_source_ref: string | null
  winner_player_id: string | null
  next_match_id: string | null
  next_match_slot: string | null
  created_at: string
  updated_at: string
}

export const BRACKET_MATCH_SELECT_COLUMNS = `
  id, tournament_id, phase_id, match_id, bracket_round, bracket_position,
  home_source_type, home_source_ref, away_source_type, away_source_ref,
  winner_player_id, next_match_id, next_match_slot, created_at, updated_at
`.trim()

function mapRowToBracketMatch(row: BracketMatchRow): BracketMatch {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    phaseId: row.phase_id,
    matchId: row.match_id,
    bracketRound: row.bracket_round as BracketRound,
    bracketPosition: row.bracket_position,
    homeSourceType: row.home_source_type as BracketSourceType,
    homeSourceRef: row.home_source_ref,
    awaySourceType: row.away_source_type as BracketSourceType,
    awaySourceRef: row.away_source_ref,
    winnerPlayerId: row.winner_player_id,
    nextMatchId: row.next_match_id,
    nextMatchSlot: row.next_match_slot as BracketNextMatchSlot | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class BracketMatchRepository {
  constructor(private readonly db: Database.Database = getDatabase()) {}

  createBracketMatch(input: CreateBracketMatchInput): BracketMatch {
    const tournamentId = assertNonEmptyString(input.tournamentId, 'tournamentId')
    const phaseId = assertNonEmptyString(input.phaseId, 'phaseId')
    const id = input.id ?? randomUUID()
    const timestamp = nowIsoString()

    this.db
      .prepare(
        `INSERT INTO bracket_matches (
          id, tournament_id, phase_id, match_id, bracket_round, bracket_position,
          home_source_type, home_source_ref, away_source_type, away_source_ref,
          winner_player_id, next_match_id, next_match_slot, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        tournamentId,
        phaseId,
        input.matchId ?? null,
        input.bracketRound,
        input.bracketPosition,
        input.homeSourceType,
        input.homeSourceRef,
        input.awaySourceType,
        input.awaySourceRef,
        input.winnerPlayerId ?? null,
        input.nextMatchId ?? null,
        input.nextMatchSlot ?? null,
        timestamp,
        timestamp,
      )

    return this.getBracketMatchById(id)!
  }

  getBracketMatchById(id: string): BracketMatch | null {
    const bracketMatchId = assertNonEmptyString(id, 'bracketMatchId')
    const row = this.db
      .prepare(
        `SELECT ${BRACKET_MATCH_SELECT_COLUMNS}
         FROM bracket_matches
         WHERE id = ?`,
      )
      .get(bracketMatchId) as BracketMatchRow | undefined

    return row ? mapRowToBracketMatch(row) : null
  }

  countBracketMatchesByPhase(phaseId: string): number {
    const validatedPhaseId = assertNonEmptyString(phaseId, 'phaseId')
    const row = this.db
      .prepare(`SELECT COUNT(*) AS count FROM bracket_matches WHERE phase_id = ?`)
      .get(validatedPhaseId) as { count: number }

    return row.count
  }

  listBracketMatchesByPhase(phaseId: string): BracketMatch[] {
    const validatedPhaseId = assertNonEmptyString(phaseId, 'phaseId')
    const rows = this.db
      .prepare(
        `SELECT ${BRACKET_MATCH_SELECT_COLUMNS}
         FROM bracket_matches
         WHERE phase_id = ?
         ORDER BY
           CASE bracket_round
             WHEN 'ROUND_OF_16' THEN 1
             WHEN 'QUARTERFINAL' THEN 2
             WHEN 'SEMIFINAL' THEN 3
             WHEN 'FINAL' THEN 4
             ELSE 5
           END ASC,
           bracket_position ASC`,
      )
      .all(validatedPhaseId) as BracketMatchRow[]

    return rows.map(mapRowToBracketMatch)
  }

  getBracketMatchByMatchId(matchId: string): BracketMatch | null {
    const validatedMatchId = assertNonEmptyString(matchId, 'matchId')
    const row = this.db
      .prepare(
        `SELECT ${BRACKET_MATCH_SELECT_COLUMNS}
         FROM bracket_matches
         WHERE match_id = ?`,
      )
      .get(validatedMatchId) as BracketMatchRow | undefined

    return row ? mapRowToBracketMatch(row) : null
  }

  setWinnerPlayerId(id: string, winnerPlayerId: string): BracketMatch {
    const bracketMatchId = assertNonEmptyString(id, 'bracketMatchId')
    const validatedWinnerPlayerId = assertNonEmptyString(winnerPlayerId, 'winnerPlayerId')
    const updatedAt = nowIsoString()

    this.db
      .prepare(
        `UPDATE bracket_matches
         SET winner_player_id = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(validatedWinnerPlayerId, updatedAt, bracketMatchId)

    return this.getBracketMatchById(bracketMatchId)!
  }

  setMatchId(id: string, matchId: string): BracketMatch {
    const bracketMatchId = assertNonEmptyString(id, 'bracketMatchId')
    const validatedMatchId = assertNonEmptyString(matchId, 'matchId')
    const updatedAt = nowIsoString()

    this.db
      .prepare(
        `UPDATE bracket_matches
         SET match_id = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(validatedMatchId, updatedAt, bracketMatchId)

    return this.getBracketMatchById(bracketMatchId)!
  }
}
