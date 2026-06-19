import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '@database'
import {
  FixtureGenerationError,
  generateRoundRobinFixtures,
  type RoundRobinFixtureMatch,
} from '@modules/fixtures'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import {
  assertNonEmptyString,
  nowIsoString,
  ValidationError,
} from '@modules/tournaments/tournament.validation'
import { MIN_TOURNAMENT_PLAYERS, ValidationMessages } from '@shared/validation'
import { validateMatchResultGoals } from './match.validation'
import type { ListMatchesOptions, Match, MatchStatus } from '@shared/types/match'

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

export class MatchRepository {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
  ) {}

  generateFixtureForTournament(tournamentId: string): Match[] {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const tournament = this.tournamentRepository.getTournamentById(validatedTournamentId)

    if (!tournament) {
      throw new ValidationError(`Tournament not found: ${validatedTournamentId}`)
    }

    if (this.countMatchesByTournament(validatedTournamentId) > 0) {
      throw new ValidationError(ValidationMessages.fixtureAlreadyGenerated)
    }

    if (tournament.status !== 'draft') {
      throw new ValidationError('Fixture can only be generated for draft tournaments')
    }

    const players = this.tournamentRepository.getTournamentPlayers(validatedTournamentId)
    const playerIds = players.map((player) => player.id)

    if (playerIds.length < MIN_TOURNAMENT_PLAYERS) {
      throw new ValidationError(ValidationMessages.tournamentMinPlayers)
    }

    let fixtures: RoundRobinFixtureMatch[]

    try {
      fixtures = generateRoundRobinFixtures(playerIds)
    } catch (error) {
      if (error instanceof FixtureGenerationError) {
        throw new ValidationError(error.message)
      }

      throw error
    }

    const generateFixture = this.db.transaction((fixturesToInsert: RoundRobinFixtureMatch[]) => {
      const matches = fixturesToInsert.map((fixture) =>
        this.insertMatch(validatedTournamentId, fixture),
      )
      const updatedAt = nowIsoString()

      this.db
        .prepare(`UPDATE tournaments SET status = ?, updated_at = ? WHERE id = ?`)
        .run('active', updatedAt, validatedTournamentId)

      return matches
    })

    return generateFixture(fixtures)
  }

  listMatchesByTournament(options: ListMatchesOptions): Match[] {
    const validatedTournamentId = assertNonEmptyString(options.tournamentId, 'tournamentId')

    if (options.roundNumber !== undefined) {
      const rows = this.db
        .prepare(
          `SELECT id, tournament_id, round_number, home_player_id, away_player_id,
                  home_goals, away_goals, status, created_at, updated_at
           FROM matches
           WHERE tournament_id = ? AND round_number = ?
           ORDER BY round_number ASC, created_at ASC`,
        )
        .all(validatedTournamentId, options.roundNumber) as MatchRow[]

      return rows.map(mapRowToMatch)
    }

    const rows = this.db
      .prepare(
        `SELECT id, tournament_id, round_number, home_player_id, away_player_id,
                home_goals, away_goals, status, created_at, updated_at
         FROM matches
         WHERE tournament_id = ?
         ORDER BY round_number ASC, created_at ASC`,
      )
      .all(validatedTournamentId) as MatchRow[]

    return rows.map(mapRowToMatch)
  }

  getMatchById(id: string): Match | null {
    const matchId = assertNonEmptyString(id, 'matchId')
    const row = this.db
      .prepare(
        `SELECT id, tournament_id, round_number, home_player_id, away_player_id,
                home_goals, away_goals, status, created_at, updated_at
         FROM matches
         WHERE id = ?`,
      )
      .get(matchId) as MatchRow | undefined

    return row ? mapRowToMatch(row) : null
  }

  updateMatchResult(matchId: string, homeGoals: number, awayGoals: number): Match {
    const validatedMatchId = assertNonEmptyString(matchId, 'matchId')
    const validatedGoals = validateMatchResultGoals(homeGoals, awayGoals)

    if (!this.getMatchById(validatedMatchId)) {
      throw new ValidationError(`Match not found: ${validatedMatchId}`)
    }

    const updatedAt = nowIsoString()

    this.db
      .prepare(
        `UPDATE matches
         SET home_goals = ?, away_goals = ?, status = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        validatedGoals.homeGoals,
        validatedGoals.awayGoals,
        'played',
        updatedAt,
        validatedMatchId,
      )

    return this.getMatchById(validatedMatchId)!
  }

  private countMatchesByTournament(tournamentId: string): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) as count FROM matches WHERE tournament_id = ?`)
      .get(tournamentId) as { count: number }

    return row.count
  }

  private insertMatch(tournamentId: string, fixture: RoundRobinFixtureMatch): Match {
    const id = randomUUID()
    const timestamp = nowIsoString()

    this.db
      .prepare(
        `INSERT INTO matches (
          id, tournament_id, round_number, home_player_id, away_player_id,
          home_goals, away_goals, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        tournamentId,
        fixture.roundNumber,
        fixture.homePlayerId,
        fixture.awayPlayerId,
        null,
        null,
        'scheduled',
        timestamp,
        timestamp,
      )

    return {
      id,
      tournamentId,
      roundNumber: fixture.roundNumber,
      homePlayerId: fixture.homePlayerId,
      awayPlayerId: fixture.awayPlayerId,
      homeGoals: null,
      awayGoals: null,
      status: 'scheduled',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  }
}
