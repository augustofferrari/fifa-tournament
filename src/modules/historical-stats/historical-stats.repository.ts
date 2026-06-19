import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import {
  mapRowToMatch,
  MATCH_SELECT_COLUMNS,
  type MatchRow,
} from '@modules/matches/match.mapper'
import type {
  HistoricalStatsSnapshot,
  TournamentPlayerEntry,
} from '@shared/types/historical-stats'
import type { Player } from '@shared/types/player'
import {
  mapRowToTournament,
  TOURNAMENT_SELECT_COLUMNS,
  type TournamentRow,
} from '@modules/tournaments/tournament.mapper'
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

interface TournamentPlayerRow {
  tournament_id: string
  player_id: string
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
          `SELECT ${TOURNAMENT_SELECT_COLUMNS}
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
          `SELECT ${MATCH_SELECT_COLUMNS}
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
