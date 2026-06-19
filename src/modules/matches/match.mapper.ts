import type { Match, MatchStatus } from '@shared/types/match'

export interface MatchRow {
  id: string
  tournament_id: string
  phase_id: string | null
  group_id: string | null
  bracket_round: string | null
  bracket_position: number | null
  round_number: number
  home_player_id: string
  away_player_id: string
  home_goals: number | null
  away_goals: number | null
  status: string
  created_at: string
  updated_at: string
}

export const MATCH_SELECT_COLUMNS = `
  id, tournament_id, phase_id, group_id, bracket_round, bracket_position,
  round_number, home_player_id, away_player_id, home_goals, away_goals,
  status, created_at, updated_at
`.trim()

export function mapRowToMatch(row: MatchRow): Match {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    phaseId: row.phase_id,
    groupId: row.group_id,
    bracketRound: row.bracket_round,
    bracketPosition: row.bracket_position,
    roundNumber: row.round_number,
    homePlayerId: row.home_player_id,
    awayPlayerId: row.away_player_id,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    status: row.status as MatchStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
