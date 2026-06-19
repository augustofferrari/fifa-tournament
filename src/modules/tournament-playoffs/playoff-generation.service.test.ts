import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { ValidationError } from '../tournaments/tournament.validation'
import { BracketRound, BracketSourceType } from '@shared/types/bracket-match'
import { TournamentFormat } from '@shared/types/tournament-format'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { BracketMatchRepository } from './bracket-match.repository'
import { PlayoffGenerationService } from './playoff-generation.service'

describe('PlayoffGenerationService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let tournamentPhaseService: TournamentPhaseService
  let matchRepository: MatchRepository
  let bracketMatchRepository: BracketMatchRepository
  let playoffGenerationService: PlayoffGenerationService

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    tournamentPhaseService = new TournamentPhaseService(
      db,
      tournamentRepository,
      new TournamentPhaseRepository(db),
    )
    matchRepository = new MatchRepository(db, tournamentRepository, tournamentPhaseService)
    bracketMatchRepository = new BracketMatchRepository(db)
    playoffGenerationService = new PlayoffGenerationService(
      db,
      tournamentRepository,
      tournamentPhaseService,
      matchRepository,
      bracketMatchRepository,
    )
  })

  afterEach(() => {
    db.close()
  })

  function createRoundRobinPlayoffsTournament(playerNames: string[]) {
    const tournament = tournamentRepository.createTournament({
      name: 'League + Playoffs',
      format: TournamentFormat.ROUND_ROBIN_PLAYOFFS,
      playoffQualifiedCount: playerNames.length,
    })
    const players = playerNames.map((name) => playerRepository.createPlayer({ name }))
    const playerIds = players.map((player) => player.id)
    tournamentRepository.addPlayersToTournament(tournament.id, playerIds)
    tournamentPhaseService.createPhasesForTournament(tournament.id)
    matchRepository.generateFixtureForTournament(tournament.id)

    return { tournament, players, playerIds }
  }

  function playAllRegularSeasonMatches(tournamentId: string) {
    const phases = tournamentPhaseService.getTournamentPhases(tournamentId)
    const regularSeasonPhase = phases.find(
      (phase) => phase.phaseType === TournamentPhaseType.ROUND_ROBIN,
    )!

    for (const match of matchRepository.listMatchesByTournament({ tournamentId })) {
      if (match.phaseId !== regularSeasonPhase.id) {
        continue
      }

      matchRepository.updateMatchResult(match.id, 1, 0)
    }
  }

  it('generates first-round playoff matches and bracket metadata for four teams', () => {
    const { tournament } = createRoundRobinPlayoffsTournament([
      'First',
      'Second',
      'Third',
      'Fourth',
    ])
    playAllRegularSeasonMatches(tournament.id)

    const standings = tournamentRepository.getTournamentStandings(tournament.id)
    const result = playoffGenerationService.generatePlayoffs({
      tournamentId: tournament.id,
      qualifiedCount: 4,
    })

    expect(result.firstRoundMatches).toHaveLength(2)
    expect(result.bracketMatches).toHaveLength(3)

    const semifinals = result.bracketMatches.filter(
      (entry) => entry.bracketRound === BracketRound.SEMIFINAL,
    )
    const final = result.bracketMatches.find((entry) => entry.bracketRound === BracketRound.FINAL)

    expect(semifinals).toHaveLength(2)
    expect(final).toBeDefined()

    const firstSemifinalMatch = result.firstRoundMatches.find(
      (match) => match.bracketPosition === 1,
    )!
    const secondSemifinalMatch = result.firstRoundMatches.find(
      (match) => match.bracketPosition === 2,
    )!

    expect([firstSemifinalMatch.homePlayerId, firstSemifinalMatch.awayPlayerId].sort()).toEqual(
      [standings[0]!.playerId, standings[3]!.playerId].sort(),
    )
    expect([secondSemifinalMatch.homePlayerId, secondSemifinalMatch.awayPlayerId].sort()).toEqual(
      [standings[1]!.playerId, standings[2]!.playerId].sort(),
    )

    const firstBracketMatch = semifinals.find((entry) => entry.bracketPosition === 1)!
    expect(firstBracketMatch.homeSourceType).toBe(BracketSourceType.STANDING_POSITION)
    expect(firstBracketMatch.homeSourceRef).toBe('1')
    expect(firstBracketMatch.awaySourceRef).toBe('4')
    expect(firstBracketMatch.matchId).toBe(firstSemifinalMatch.id)
    expect(firstBracketMatch.nextMatchId).toBe(final?.id)

    const phases = tournamentPhaseService.getTournamentPhases(tournament.id)
    expect(phases.find((phase) => phase.phaseType === TournamentPhaseType.ROUND_ROBIN)?.status).toBe(
      'completed',
    )
    expect(tournamentPhaseService.getActivePhase(tournament.id)?.phaseType).toBe(
      TournamentPhaseType.PLAYOFF,
    )
  })

  it('seeds eight teams using 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6', () => {
    const { tournament } = createRoundRobinPlayoffsTournament([
      'Seed 1',
      'Seed 2',
      'Seed 3',
      'Seed 4',
      'Seed 5',
      'Seed 6',
      'Seed 7',
      'Seed 8',
    ])
    playAllRegularSeasonMatches(tournament.id)

    const standings = tournamentRepository.getTournamentStandings(tournament.id)
    const result = playoffGenerationService.generatePlayoffs({
      tournamentId: tournament.id,
      qualifiedCount: 8,
    })

    expect(result.firstRoundMatches).toHaveLength(4)
    expect(result.bracketMatches).toHaveLength(7)

    const expectedPairings = [
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ]

    for (const [index, seeds] of expectedPairings.entries()) {
      const match = result.firstRoundMatches.find((entry) => entry.bracketPosition === index + 1)!
      const expectedPlayerIds = seeds.map((seed) => standings[seed - 1]!.playerId).sort()

      expect([match.homePlayerId, match.awayPlayerId].sort()).toEqual(expectedPlayerIds)
    }
  })

  it('requires all regular season matches to be played', () => {
    const { tournament } = createRoundRobinPlayoffsTournament(['A', 'B', 'C', 'D'])

    expect(() =>
      playoffGenerationService.generatePlayoffs({
        tournamentId: tournament.id,
        qualifiedCount: 4,
      }),
    ).toThrow('All regular season matches must be played before generating playoffs')
  })

  it('rejects unsupported qualified counts', () => {
    const { tournament } = createRoundRobinPlayoffsTournament(['A', 'B', 'C', 'D'])
    playAllRegularSeasonMatches(tournament.id)

    expect(() =>
      playoffGenerationService.generatePlayoffs({
        tournamentId: tournament.id,
        qualifiedCount: 6,
      }),
    ).toThrow('qualifiedCount must be one of 2, 4, 8, 16')
  })

  it('prevents generating playoffs twice', () => {
    const { tournament } = createRoundRobinPlayoffsTournament(['A', 'B', 'C', 'D'])
    playAllRegularSeasonMatches(tournament.id)

    playoffGenerationService.generatePlayoffs({
      tournamentId: tournament.id,
      qualifiedCount: 4,
    })

    expect(() =>
      playoffGenerationService.generatePlayoffs({
        tournamentId: tournament.id,
        qualifiedCount: 4,
      }),
    ).toThrow('Playoffs have already been generated for this tournament')
  })
})
