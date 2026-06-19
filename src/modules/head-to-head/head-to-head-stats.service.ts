import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import {
  mapRowToMatch,
  MATCH_SELECT_COLUMNS,
  type MatchRow,
} from '@modules/matches/match.mapper'
import { assertNonEmptyString, ValidationError } from '@modules/players/player.validation'
import type { HeadToHeadStats } from '@shared/types/head-to-head'
import { calculateHeadToHeadStats } from './head-to-head-stats.calculator'

interface TournamentNameRow {
  id: string
  name: string
}

export class HeadToHeadStatsService {
  constructor(private readonly db: Database.Database = getDatabase()) {}

  getHeadToHeadStats(playerAId: string, playerBId: string): HeadToHeadStats {
    const validatedPlayerAId = assertNonEmptyString(playerAId, 'playerAId')
    const validatedPlayerBId = assertNonEmptyString(playerBId, 'playerBId')

    if (validatedPlayerAId === validatedPlayerBId) {
      throw new ValidationError('playerAId and playerBId must be different')
    }

    const matches = (
      this.db
        .prepare(
          `SELECT ${MATCH_SELECT_COLUMNS}
           FROM matches
           WHERE status = 'played'
             AND home_goals IS NOT NULL
             AND away_goals IS NOT NULL
             AND (
               (home_player_id = ? AND away_player_id = ?)
               OR (home_player_id = ? AND away_player_id = ?)
             )
           ORDER BY updated_at DESC`,
        )
        .all(
          validatedPlayerAId,
          validatedPlayerBId,
          validatedPlayerBId,
          validatedPlayerAId,
        ) as MatchRow[]
    ).map(mapRowToMatch)

    const tournamentIds = [...new Set(matches.map((match) => match.tournamentId))]
    const tournamentNamesById = new Map<string, string>()

    if (tournamentIds.length > 0) {
      const placeholders = tournamentIds.map(() => '?').join(', ')
      const tournamentRows = this.db
        .prepare(`SELECT id, name FROM tournaments WHERE id IN (${placeholders})`)
        .all(...tournamentIds) as TournamentNameRow[]

      for (const row of tournamentRows) {
        tournamentNamesById.set(row.id, row.name)
      }
    }

    return calculateHeadToHeadStats({
      playerAId: validatedPlayerAId,
      playerBId: validatedPlayerBId,
      matches,
      tournamentNamesById,
    })
  }
}
