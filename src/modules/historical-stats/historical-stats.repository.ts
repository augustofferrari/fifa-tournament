import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import type { Match, MatchStatus } from '@shared/types/match'
import type {
  HistoricalStatsSnapshot,
  TournamentPlayerEntry,
} from '@shared/types/historical-stats'
import type { Player } from '@shared/types/player'
import type { Tournament, TournamentStatus } from '@shared/types/tournament'
import { calculateHistoricalStats } from './historical-stats.calculator'

interface PlayerRow {
  id: string
  name: string
  nickname: string | null
  team_name: string | null
  photo_path: string | null
  created_at: string
  updated_at: string
}

interface TournamentRow {
  id: string
  name: string
  status: string
  points_win: number
  points_draw: number
  points_loss: number
  created_at: string
  updated_at: string
}

interface TournamentPlayerRow {
  tournament_id: string
  player_id: string
}

interface MatchRow {
  id: string
  tournament_id: string
  round_number: number
  home_player_id: string
  away_player_id: string
  home_goals: number | null
  away_goals: number | null
  status: string
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

function mapRowToTournament(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    status: row.status as TournamentStatus,
    pointsWin: row.points_win,
    pointsDraw: row.points_draw,
    pointsLoss: row.points_loss,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRowToMatch(row: MatchRow): Match {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
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

export class HistoricalStatsRepository {
  constructor(private readonly db: Database.Database = getDatabase()) {}

  getGlobalPlayerStats(): HistoricalStatsSnapshot {
    const players = (
      this.db
        .prepare(
          `SELECT id, name, nickname, team_name, photo_path, created_at, updated_at
           FROM players
           ORDER BY name COLLATE NOCASE ASC`,
        )
        .all() as PlayerRow[]
    ).map(mapRowToPlayer)

    const tournaments = (
      this.db
        .prepare(
          `SELECT id, name, status, points_win, points_draw, points_loss, created_at, updated_at
           FROM tournaments`,
        )
        .all() as TournamentRow[]
    ).map(mapRowToTournament)

    const tournamentPlayers = (
      this.db
        .prepare(`SELECT tournament_id, player_id FROM tournament_players`)
        .all() as TournamentPlayerRow[]
    ).map(
      (row): TournamentPlayerEntry => ({
        tournamentId: row.tournament_id,
        playerId: row.player_id,
      }),
    )

    const matches = (
      this.db
        .prepare(
          `SELECT id, tournament_id, round_number, home_player_id, away_player_id,
                  home_goals, away_goals, status, created_at, updated_at
           FROM matches`,
        )
        .all() as MatchRow[]
    ).map(mapRowToMatch)

    return calculateHistoricalStats({
      players,
      tournaments,
      tournamentPlayers,
      matches,
    })
  }
}
