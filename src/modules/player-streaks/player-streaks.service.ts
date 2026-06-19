import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import {
  mapRowToMatch,
  MATCH_SELECT_COLUMNS,
  type MatchRow,
} from '@modules/matches/match.mapper'
import { PlayerRepository } from '@modules/players/player.repository'
import { assertNonEmptyString, ValidationError } from '@modules/players/player.validation'
import type { PlayerStreaks } from '@shared/types/player-streaks'
import type { PlayerStreaks } from '@shared/types/player-streaks'
import { calculateAllPlayerStreaks, calculatePlayerStreaks } from './player-streaks.calculator'

function listAllPlayedMatches(db: Database.Database) {
  return (
    db
      .prepare(
        `SELECT ${MATCH_SELECT_COLUMNS}
         FROM matches
         WHERE status = 'played'
           AND home_goals IS NOT NULL
           AND away_goals IS NOT NULL
         ORDER BY updated_at ASC`,
      )
      .all() as MatchRow[]
  ).map(mapRowToMatch)
}

export class PlayerStreakService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly playerRepository: PlayerRepository = new PlayerRepository(db),
  ) {}

  getPlayerStreaks(playerId: string): PlayerStreaks {
    const validatedPlayerId = assertNonEmptyString(playerId, 'playerId')

    if (!this.playerRepository.getPlayerById(validatedPlayerId)) {
      throw new ValidationError(`Player not found: ${validatedPlayerId}`)
    }

    const matches = (
      this.db
        .prepare(
          `SELECT ${MATCH_SELECT_COLUMNS}
           FROM matches
           WHERE status = 'played'
             AND home_goals IS NOT NULL
             AND away_goals IS NOT NULL
             AND (home_player_id = ? OR away_player_id = ?)
           ORDER BY updated_at ASC`,
        )
        .all(validatedPlayerId, validatedPlayerId) as MatchRow[]
    ).map(mapRowToMatch)

    return calculatePlayerStreaks({
      playerId: validatedPlayerId,
      matches,
    })
  }

  getAllPlayerStreaks(): PlayerStreaks[] {
    const players = this.playerRepository.listPlayers()
    const matches = listAllPlayedMatches(this.db)

    return calculateAllPlayerStreaks(
      players.map((player) => player.id),
      matches,
    )
  }
}
