import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '@database'
import type { Player } from '@shared/types/player'
import type {
  CreateTournamentInput,
  ListTournamentsOptions,
  Tournament,
  TournamentStatus,
} from '@shared/types/tournament'
import type { StandingRow } from '@shared/types/standings'
import { MatchRepository } from '@modules/matches/match.repository'
import { TournamentPhaseRepository } from '@modules/tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '@modules/tournament-phases/tournament-phase.service'
import { calculateStandings } from './standings.calculator'
import {
  booleanToSqliteInteger,
  mapRowToTournament,
  TOURNAMENT_SELECT_COLUMNS,
  type TournamentRow,
} from './tournament.mapper'
import {
  assertNonEmptyString,
  assertTournamentStatus,
  nowIsoString,
  validateCreateTournamentInput,
  validateTournamentPlayerSelection,
  ValidationError,
} from './tournament.validation'
import { createRemovedPlayer } from '@shared/validation'
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

export class TournamentRepository {
  constructor(private readonly db: Database.Database = getDatabase()) {}

  createTournament(input: CreateTournamentInput): Tournament {
    const validated = validateCreateTournamentInput(input)
    const id = randomUUID()
    const timestamp = nowIsoString()

    this.db
      .prepare(
        `INSERT INTO tournaments (
          id, name, status, format, has_group_stage, has_playoffs, has_knockout_stage,
          playoff_qualified_count, group_count, players_per_group,
          points_win, points_draw, points_loss, results_unlocked, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        validated.name,
        'draft',
        validated.format,
        booleanToSqliteInteger(validated.hasGroupStage),
        booleanToSqliteInteger(validated.hasPlayoffs),
        booleanToSqliteInteger(validated.hasKnockoutStage),
        validated.playoffQualifiedCount,
        validated.groupCount,
        validated.playersPerGroup,
        validated.pointsWin,
        validated.pointsDraw,
        validated.pointsLoss,
        0,
        timestamp,
        timestamp,
      )

    return this.getTournamentById(id)!
  }

  updateTournamentStatus(id: string, status: TournamentStatus): Tournament {
    const tournamentId = assertNonEmptyString(id, 'id')
    const validatedStatus = assertTournamentStatus(status)
    const existing = this.getTournamentById(tournamentId)

    if (!existing) {
      throw createValidationError('errors.tournamentNotFound', { id: tournamentId })
    }

    const updatedAt = nowIsoString()

    this.db
      .prepare(`UPDATE tournaments SET status = ?, updated_at = ? WHERE id = ?`)
      .run(validatedStatus, updatedAt, tournamentId)

    return this.getTournamentById(tournamentId)!
  }

  setResultsUnlocked(id: string, resultsUnlocked: boolean): Tournament {
    const tournamentId = assertNonEmptyString(id, 'id')
    const existing = this.getTournamentById(tournamentId)

    if (!existing) {
      throw createValidationError('errors.tournamentNotFound', { id: tournamentId })
    }

    const updatedAt = nowIsoString()

    this.db
      .prepare(`UPDATE tournaments SET results_unlocked = ?, updated_at = ? WHERE id = ?`)
      .run(booleanToSqliteInteger(resultsUnlocked), updatedAt, tournamentId)

    return this.getTournamentById(tournamentId)!
  }

  getTournamentById(id: string): Tournament | null {
    const tournamentId = assertNonEmptyString(id, 'id')
    const row = this.db
      .prepare(
        `SELECT ${TOURNAMENT_SELECT_COLUMNS}
         FROM tournaments
         WHERE id = ?`,
      )
      .get(tournamentId) as TournamentRow | undefined

    return row ? mapRowToTournament(row) : null
  }

  listTournaments(options: ListTournamentsOptions = {}): Tournament[] {
    if (options.status !== undefined) {
      const status = assertTournamentStatus(options.status)

      const rows = this.db
        .prepare(
          `SELECT ${TOURNAMENT_SELECT_COLUMNS}
           FROM tournaments
           WHERE status = ?
           ORDER BY created_at DESC`,
        )
        .all(status) as TournamentRow[]

      return rows.map(mapRowToTournament)
    }

    const rows = this.db
      .prepare(
        `SELECT ${TOURNAMENT_SELECT_COLUMNS}
         FROM tournaments
         ORDER BY created_at DESC`,
      )
      .all() as TournamentRow[]

    return rows.map(mapRowToTournament)
  }

  addPlayersToTournament(tournamentId: string, playerIds: string[]): Player[] {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const tournament = this.getTournamentById(validatedTournamentId)

    if (!tournament) {
      throw createValidationError('errors.tournamentNotFound', { id: validatedTournamentId })
    }

    const validatedPlayerIds = validateTournamentPlayerSelection(playerIds, tournament)

    const findPlayer = this.db.prepare('SELECT id FROM players WHERE id = ?')
    const insertTournamentPlayer = this.db.prepare(
      `INSERT OR IGNORE INTO tournament_players (id, tournament_id, player_id)
       VALUES (?, ?, ?)`,
    )

    const addPlayers = this.db.transaction((ids: string[]) => {
      for (const playerId of ids) {
        const player = findPlayer.get(playerId)

        if (!player) {
          throw createValidationError('errors.playerNotFound', { id: playerId })
        }

        insertTournamentPlayer.run(randomUUID(), validatedTournamentId, playerId)
      }
    })

    addPlayers(validatedPlayerIds)

    return this.getTournamentPlayers(validatedTournamentId)
  }

  getTournamentPlayers(tournamentId: string): Player[] {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')

    if (!this.getTournamentById(validatedTournamentId)) {
      throw createValidationError('errors.tournamentNotFound', { id: validatedTournamentId })
    }

    const rows = this.db
      .prepare(
        `SELECT p.id, p.name, p.nickname, p.team_name, p.photo_path, p.created_at, p.updated_at
         FROM tournament_players tp
         INNER JOIN players p ON p.id = tp.player_id
         WHERE tp.tournament_id = ?
         ORDER BY p.name COLLATE NOCASE ASC`,
      )
      .all(validatedTournamentId) as PlayerRow[]

    return rows.map(mapRowToPlayer)
  }

  getTournamentPlayersIncludingRemoved(tournamentId: string): Player[] {
    const rosterPlayers = this.getTournamentPlayers(tournamentId)
    const matchRepository = this.createMatchRepository()
    const matches = matchRepository.listMatchesByTournament({ tournamentId })
    const rosterIds = new Set(rosterPlayers.map((player) => player.id))
    const removedPlayerIds = new Set<string>()

    for (const match of matches) {
      if (!rosterIds.has(match.homePlayerId)) {
        removedPlayerIds.add(match.homePlayerId)
      }

      if (!rosterIds.has(match.awayPlayerId)) {
        removedPlayerIds.add(match.awayPlayerId)
      }
    }

    const removedPlayers = [...removedPlayerIds].map((playerId) => createRemovedPlayer(playerId))

    return [...rosterPlayers, ...removedPlayers]
  }

  getTournamentStandings(tournamentId: string, phaseId?: string): StandingRow[] {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const tournament = this.getTournamentById(validatedTournamentId)

    if (!tournament) {
      throw createValidationError('errors.tournamentNotFound', { id: validatedTournamentId })
    }

    const players = this.getTournamentPlayersIncludingRemoved(validatedTournamentId)
    const matchRepository = this.createMatchRepository()
    const matches = matchRepository.listMatchesByTournament({ tournamentId: validatedTournamentId })
    const filteredMatches = phaseId
      ? matches.filter((match) => match.phaseId === phaseId)
      : matches

    return calculateStandings(players, filteredMatches, tournament)
  }

  private createMatchRepository(): MatchRepository {
    return new MatchRepository(
      this.db,
      this,
      new TournamentPhaseService(this.db, this, new TournamentPhaseRepository(this.db)),
    )
  }
}
