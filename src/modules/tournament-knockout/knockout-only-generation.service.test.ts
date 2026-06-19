import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { BracketMatchRepository } from '../tournament-playoffs/bracket-match.repository'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { ValidationError } from '../tournaments/tournament.validation'
import { BracketRound } from '@shared/types/bracket-match'
import { TournamentFormat } from '@shared/types/tournament-format'
import { KnockoutOnlyGenerationService } from './knockout-only-generation.service'

describe('KnockoutOnlyGenerationService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let tournamentPhaseService: TournamentPhaseService
  let matchRepository: MatchRepository
  let bracketMatchRepository: BracketMatchRepository
  let knockoutOnlyGenerationService: KnockoutOnlyGenerationService

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
    knockoutOnlyGenerationService = new KnockoutOnlyGenerationService(
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

  function createKnockoutOnlyTournament(playerNames: string[]) {
    const tournament = tournamentRepository.createTournament({
      name: 'Knockout Cup',
      format: TournamentFormat.KNOCKOUT_ONLY,
    })
    const players = playerNames.map((name) => playerRepository.createPlayer({ name }))
    const playerIds = players.map((player) => player.id)
    tournamentRepository.addPlayersToTournament(tournament.id, playerIds)
    tournamentPhaseService.createPhasesForTournament(tournament.id)

    return { tournament, players, playerIds }
  }

  it('generates a final match for two players', () => {
    const { tournament, playerIds } = createKnockoutOnlyTournament(['Seed 1', 'Seed 2'])

    const result = knockoutOnlyGenerationService.generateKnockout({
      tournamentId: tournament.id,
      playerIds,
    })

    expect(result.firstRoundMatches).toHaveLength(1)
    expect(result.firstRoundMatches[0]?.bracketRound).toBe(BracketRound.FINAL)
    expect(result.bracketMatches).toHaveLength(1)
    expect(result.advancedByePlayerIds).toEqual([])
    expect(tournamentRepository.getTournamentById(tournament.id)?.status).toBe('active')
  })

  it('creates one first-round match and auto-advances the bye winner for three players', () => {
    const { tournament, playerIds } = createKnockoutOnlyTournament(['Seed 1', 'Seed 2', 'Seed 3'])

    const result = knockoutOnlyGenerationService.generateKnockout({
      tournamentId: tournament.id,
      playerIds,
    })

    expect(result.firstRoundMatches).toHaveLength(1)
    expect(result.advancedByePlayerIds).toEqual([playerIds[0]])

    const byeAdvance = result.bracketMatches.find((entry) => entry.winnerPlayerId === playerIds[0])
    expect(byeAdvance?.matchId).toBeNull()
    expect(byeAdvance?.bracketRound).toBe(BracketRound.SEMIFINAL)

    const playedMatch = result.firstRoundMatches[0]!
    expect([playedMatch.homePlayerId, playedMatch.awayPlayerId].sort()).toEqual(
      [playerIds[1], playerIds[2]].sort(),
    )

    const final = result.bracketMatches.find((entry) => entry.bracketRound === BracketRound.FINAL)
    expect(final?.homeSourceRef).toBe(byeAdvance?.id)
  })

  it('generates four first-round matches for eight players', () => {
    const { tournament, playerIds } = createKnockoutOnlyTournament([
      'P1',
      'P2',
      'P3',
      'P4',
      'P5',
      'P6',
      'P7',
      'P8',
    ])

    const result = knockoutOnlyGenerationService.generateKnockout({
      tournamentId: tournament.id,
      playerIds,
    })

    expect(result.firstRoundMatches).toHaveLength(4)
    expect(result.bracketMatches).toHaveLength(7)
    expect(result.advancedByePlayerIds).toEqual([])
  })

  it('requires players to be registered in the tournament', () => {
    const { tournament, playerIds } = createKnockoutOnlyTournament(['Seed 1', 'Seed 2'])

    expect(() =>
      knockoutOnlyGenerationService.generateKnockout({
        tournamentId: tournament.id,
        playerIds: [...playerIds, 'missing-player'],
      }),
    ).toThrow('Player is not registered in this tournament')
  })

  it('prevents generating knockout twice', () => {
    const { tournament, playerIds } = createKnockoutOnlyTournament(['Seed 1', 'Seed 2', 'Seed 3'])

    knockoutOnlyGenerationService.generateKnockout({
      tournamentId: tournament.id,
      playerIds,
    })

    expect(() =>
      knockoutOnlyGenerationService.generateKnockout({
        tournamentId: tournament.id,
        playerIds,
      }),
    ).toThrow('Knockout has already been generated for this tournament')
  })

  it('rejects duplicate player ids', () => {
    const { tournament, playerIds } = createKnockoutOnlyTournament(['Seed 1', 'Seed 2'])

    expect(() =>
      knockoutOnlyGenerationService.generateKnockout({
        tournamentId: tournament.id,
        playerIds: [playerIds[0]!, playerIds[0]!],
      }),
    ).toThrow(ValidationError)
  })
})
