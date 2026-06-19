import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '@database'
import {
  FixtureGenerationError,
  generateRoundRobinFixtures,
  type RoundRobinFixtureMatch,
} from '@modules/fixtures'
import {
  getTournamentPhaseService,
  TournamentPhaseService,
} from '@modules/tournament-phases'
import { BracketAdvancementService } from '@modules/tournament-playoffs/bracket-advancement.service'
import { BracketMatchRepository } from '@modules/tournament-playoffs/bracket-match.repository'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import {
  assertNonEmptyString,
  nowIsoString,
  ValidationError,
} from '@modules/tournaments/tournament.validation'
import { MIN_TOURNAMENT_PLAYERS, ValidationMessages } from '@shared/validation'
import {
  assertTournamentAllowsResultEditing,
  validateMatchResult,
} from '@shared/validation/match-result.validation'
import type { CreateMatchInput, ListMatchesOptions, Match } from '@shared/types/match'
import type { LatestMatchResult } from '@shared/types/latest-match-result'
import { MATCH_SELECT_COLUMNS, mapRowToMatch, type MatchRow } from './match.mapper'
import { validateCreateMatchInput } from './match.validation'

interface LatestMatchResultRow {
  id: string
  tournament_id: string
  tournament_name: string
  round_number: number
  home_player_id: string
  home_player_name: string | null
  away_player_id: string
  away_player_name: string | null
  home_goals: number
  away_goals: number
  updated_at: string
}

const DEFAULT_LATEST_RESULTS_LIMIT = 5
const MAX_LATEST_RESULTS_LIMIT = 50

function assertLatestResultsLimit(limit: unknown): number {
  if (limit === undefined || limit === null) {
    return DEFAULT_LATEST_RESULTS_LIMIT
  }

  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1) {
    throw new ValidationError('limit must be a positive integer')
  }

  if (limit > MAX_LATEST_RESULTS_LIMIT) {
    throw new ValidationError(`limit cannot exceed ${MAX_LATEST_RESULTS_LIMIT}`)
  }

  return limit
}

function mapRowToLatestMatchResult(row: LatestMatchResultRow): LatestMatchResult {
  return {
    matchId: row.id,
    tournamentId: row.tournament_id,
    tournamentName: row.tournament_name,
    homePlayerId: row.home_player_id,
    homePlayerName: row.home_player_name ?? ValidationMessages.removedPlayer,
    awayPlayerId: row.away_player_id,
    awayPlayerName: row.away_player_name ?? ValidationMessages.removedPlayer,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    playedAt: row.updated_at,
    roundNumber: row.round_number,
  }
}

export class MatchRepository {
  private readonly bracketAdvancementService: BracketAdvancementService

  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly tournamentPhaseService: TournamentPhaseService = getTournamentPhaseService(),
  ) {
    this.bracketAdvancementService = new BracketAdvancementService(
      db,
      new BracketMatchRepository(db),
      tournamentPhaseService,
      this,
    )
  }

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
      let activePhase = this.tournamentPhaseService.getActivePhase(validatedTournamentId)

      if (!activePhase) {
        this.tournamentPhaseService.createPhasesForTournament(validatedTournamentId)
        activePhase = this.tournamentPhaseService.getActivePhase(validatedTournamentId)
      }

      if (!activePhase) {
        throw new ValidationError('Unable to resolve active tournament phase')
      }

      const matches = fixturesToInsert.map((fixture) =>
        this.createMatch({
          tournamentId: validatedTournamentId,
          phaseId: activePhase.id,
          roundNumber: fixture.roundNumber,
          homePlayerId: fixture.homePlayerId,
          awayPlayerId: fixture.awayPlayerId,
        }),
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
          `SELECT ${MATCH_SELECT_COLUMNS}
           FROM matches
           WHERE tournament_id = ? AND round_number = ?
           ORDER BY round_number ASC, created_at ASC`,
        )
        .all(validatedTournamentId, options.roundNumber) as MatchRow[]

      return rows.map(mapRowToMatch)
    }

    const rows = this.db
      .prepare(
        `SELECT ${MATCH_SELECT_COLUMNS}
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
        `SELECT ${MATCH_SELECT_COLUMNS}
         FROM matches
         WHERE id = ?`,
      )
      .get(matchId) as MatchRow | undefined

    return row ? mapRowToMatch(row) : null
  }

  getLatestResults(limit?: number): LatestMatchResult[] {
    const validatedLimit = assertLatestResultsLimit(limit)

    const rows = this.db
      .prepare(
        `SELECT m.id, m.tournament_id, t.name AS tournament_name, m.round_number,
                m.home_player_id, hp.name AS home_player_name,
                m.away_player_id, ap.name AS away_player_name,
                m.home_goals, m.away_goals, m.updated_at
         FROM matches m
         INNER JOIN tournaments t ON t.id = m.tournament_id
         LEFT JOIN players hp ON hp.id = m.home_player_id
         LEFT JOIN players ap ON ap.id = m.away_player_id
         WHERE m.status = 'played'
           AND m.home_goals IS NOT NULL
           AND m.away_goals IS NOT NULL
         ORDER BY m.updated_at DESC
         LIMIT ?`,
      )
      .all(validatedLimit) as LatestMatchResultRow[]

    return rows.map(mapRowToLatestMatchResult)
  }

  updateMatchResult(matchId: string, homeGoals: number, awayGoals: number): Match {
    const validatedMatchId = assertNonEmptyString(matchId, 'matchId')
    const match = this.getMatchById(validatedMatchId)

    if (!match) {
      throw new ValidationError(`Match not found: ${validatedMatchId}`)
    }

    const tournament = this.tournamentRepository.getTournamentById(match.tournamentId)

    if (!tournament) {
      throw new ValidationError(`Tournament not found: ${match.tournamentId}`)
    }

    assertTournamentAllowsResultEditing(tournament)

    const phase = match.phaseId
      ? this.tournamentPhaseService
          .getTournamentPhases(match.tournamentId)
          .find((entry) => entry.id === match.phaseId)
      : undefined

    if (!phase) {
      throw new ValidationError(
        match.phaseId
          ? `Tournament phase not found: ${match.phaseId}`
          : 'Match is not associated with a tournament phase',
      )
    }

    const validatedGoals = validateMatchResult(phase.phaseType, homeGoals, awayGoals)

    const updateMatchResult = this.db.transaction((): Match => {
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

      const updatedMatch = this.getMatchById(validatedMatchId)!
      this.bracketAdvancementService.processMatchResult(
        updatedMatch,
        validatedGoals.homeGoals,
        validatedGoals.awayGoals,
      )

      this.tournamentPhaseService.tryAutoCompletePhaseAfterMatchResult(
        match.tournamentId,
        phase.id,
        this.areAllMatchesPlayedInPhase(phase.id),
      )

      return this.getMatchById(validatedMatchId)!
    })

    return updateMatchResult()
  }

  countMatchesByPhase(phaseId: string): number {
    const validatedPhaseId = assertNonEmptyString(phaseId, 'phaseId')
    const row = this.db
      .prepare(`SELECT COUNT(*) AS count FROM matches WHERE phase_id = ?`)
      .get(validatedPhaseId) as { count: number }

    return row.count
  }

  areAllMatchesPlayedInPhase(phaseId: string): boolean {
    const validatedPhaseId = assertNonEmptyString(phaseId, 'phaseId')
    const totalRow = this.db
      .prepare(`SELECT COUNT(*) AS count FROM matches WHERE phase_id = ?`)
      .get(validatedPhaseId) as { count: number }

    if (totalRow.count === 0) {
      return false
    }

    const unplayedRow = this.db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM matches
         WHERE phase_id = ?
           AND (status != 'played' OR home_goals IS NULL OR away_goals IS NULL)`,
      )
      .get(validatedPhaseId) as { count: number }

    return unplayedRow.count === 0
  }

  private countMatchesByTournament(tournamentId: string): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) as count FROM matches WHERE tournament_id = ?`)
      .get(tournamentId) as { count: number }

    return row.count
  }

  createMatch(input: CreateMatchInput): Match {
    const validated = validateCreateMatchInput(input)
    const phase = this.tournamentPhaseService.getTournamentPhases(validated.tournamentId).find(
      (entry) => entry.id === validated.phaseId,
    )

    if (!phase) {
      throw new ValidationError(`Tournament phase not found: ${validated.phaseId}`)
    }

    if (phase.tournamentId !== validated.tournamentId) {
      throw new ValidationError('phaseId does not belong to the provided tournament')
    }

    const id = randomUUID()
    const timestamp = nowIsoString()

    this.db
      .prepare(
        `INSERT INTO matches (
          id, tournament_id, phase_id, group_id, bracket_round, bracket_position,
          round_number, home_player_id, away_player_id,
          home_goals, away_goals, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        validated.tournamentId,
        validated.phaseId,
        validated.groupId,
        validated.bracketRound,
        validated.bracketPosition,
        validated.roundNumber,
        validated.homePlayerId,
        validated.awayPlayerId,
        null,
        null,
        'scheduled',
        timestamp,
        timestamp,
      )

    return this.getMatchById(id)!
  }
}
