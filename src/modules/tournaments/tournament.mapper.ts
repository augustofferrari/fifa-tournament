import type { Tournament, TournamentStatus } from '@shared/types/tournament'
import type { TournamentFormat } from '@shared/types/tournament-format'

export interface TournamentRow {
  id: string
  name: string
  status: string
  format: string
  has_group_stage: number
  has_playoffs: number
  has_knockout_stage: number
  playoff_qualified_count: number | null
  group_count: number | null
  players_per_group: number | null
  points_win: number
  points_draw: number
  points_loss: number
  results_unlocked: number
  created_at: string
  updated_at: string
}

export const TOURNAMENT_SELECT_COLUMNS = `
  id, name, status, format, has_group_stage, has_playoffs, has_knockout_stage,
  playoff_qualified_count, group_count, players_per_group,
  points_win, points_draw, points_loss, results_unlocked, created_at, updated_at
`.trim()

export function mapRowToTournament(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    status: row.status as TournamentStatus,
    format: row.format as TournamentFormat,
    hasGroupStage: row.has_group_stage === 1,
    hasPlayoffs: row.has_playoffs === 1,
    hasKnockoutStage: row.has_knockout_stage === 1,
    playoffQualifiedCount: row.playoff_qualified_count,
    groupCount: row.group_count,
    playersPerGroup: row.players_per_group,
    pointsWin: row.points_win,
    pointsDraw: row.points_draw,
    pointsLoss: row.points_loss,
    resultsUnlocked: row.results_unlocked === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function booleanToSqliteInteger(value: boolean): 0 | 1 {
  return value ? 1 : 0
}
