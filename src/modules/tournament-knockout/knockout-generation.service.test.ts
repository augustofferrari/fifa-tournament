import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { GroupGenerationService } from '../tournament-groups/group-generation.service'
import { GroupStageFixtureService } from '../tournament-groups/group-stage-fixture.service'
import { GroupStandingsService } from '../tournament-groups/group-standings.service'
import { TournamentGroupRepository } from '../tournament-groups/tournament-group.repository'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { BracketMatchRepository } from '../tournament-playoffs/bracket-match.repository'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { ValidationError } from '../tournaments/tournament.validation'
import { BracketRound, BracketSourceType } from '@shared/types/bracket-match'
import { TournamentFormat } from '@shared/types/tournament-format'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { KnockoutGenerationService } from './knockout-generation.service'

describe('KnockoutGenerationService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let tournamentPhaseService: TournamentPhaseService
  let tournamentGroupRepository: TournamentGroupRepository
  let groupGenerationService: GroupGenerationService
  let groupStageFixtureService: GroupStageFixtureService
  let groupStandingsService: GroupStandingsService
  let matchRepository: MatchRepository
  let bracketMatchRepository: BracketMatchRepository
  let knockoutGenerationService: KnockoutGenerationService

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
    tournamentGroupRepository = new TournamentGroupRepository(db)
    groupGenerationService = new GroupGenerationService(
      db,
      tournamentRepository,
      tournamentGroupRepository,
      tournamentPhaseService,
    )
    matchRepository = new MatchRepository(db, tournamentRepository, tournamentPhaseService)
    groupStageFixtureService = new GroupStageFixtureService(
      db,
      tournamentRepository,
      tournamentGroupRepository,
      tournamentPhaseService,
      matchRepository,
    )
    groupStandingsService = new GroupStandingsService(
      db,
      tournamentRepository,
      tournamentGroupRepository,
      tournamentPhaseService,
      matchRepository,
      playerRepository,
    )
    bracketMatchRepository = new BracketMatchRepository(db)
    knockoutGenerationService = new KnockoutGenerationService(
      db,
      tournamentRepository,
      tournamentPhaseService,
      matchRepository,
      bracketMatchRepository,
      groupStandingsService,
    )
  })

  afterEach(() => {
    db.close()
  })

  function setupGroupsKnockoutTournament(playerNames: string[], groupCount: number) {
    const tournament = tournamentRepository.createTournament({
      name: 'Groups Knockout Cup',
      format: TournamentFormat.GROUPS_KNOCKOUT,
      groupCount,
      playersPerGroup: Math.ceil(playerNames.length / groupCount),
      playoffQualifiedCount: 2,
    })
    const players = playerNames.map((name) => playerRepository.createPlayer({ name }))
    const playerIds = players.map((player) => player.id)
    tournamentRepository.addPlayersToTournament(tournament.id, playerIds)
    tournamentPhaseService.createPhasesForTournament(tournament.id)
    groupGenerationService.generateGroups({
      tournamentId: tournament.id,
      groupCount,
      playerIds,
    })
    groupStageFixtureService.generateFixture(tournament.id)

    return { tournament, players, playerIds }
  }

  function playAllGroupStageMatches(tournamentId: string) {
    const groupStagePhase = tournamentPhaseService
      .getTournamentPhases(tournamentId)
      .find((phase) => phase.phaseType === TournamentPhaseType.GROUP_STAGE)!

    for (const match of matchRepository.listMatchesByTournament({ tournamentId })) {
      if (match.phaseId === groupStagePhase.id) {
        matchRepository.updateMatchResult(match.id, 1, 0)
      }
    }
  }

  it('generates balanced knockout matches for two groups with top 2 qualifiers', () => {
    const { tournament } = setupGroupsKnockoutTournament(
      ['A1', 'A2', 'B1', 'B2', 'A3', 'A4', 'B3', 'B4'],
      2,
    )
    playAllGroupStageMatches(tournament.id)

    const groupStandings = groupStandingsService.getGroupStandings(tournament.id)
    const result = knockoutGenerationService.generateKnockout({
      tournamentId: tournament.id,
      qualifiersPerGroup: 2,
    })

    expect(result.firstRoundMatches).toHaveLength(2)
    expect(result.bracketMatches).toHaveLength(3)

    const groupA = groupStandings.find((group) => group.groupName === 'Group A')!
    const groupB = groupStandings.find((group) => group.groupName === 'Group B')!

    const firstMatch = result.firstRoundMatches.find((match) => match.bracketPosition === 1)!
    const secondMatch = result.firstRoundMatches.find((match) => match.bracketPosition === 2)!

    expect([firstMatch.homePlayerId, firstMatch.awayPlayerId].sort()).toEqual(
      [groupA.standings[0]!.playerId, groupB.standings[1]!.playerId].sort(),
    )
    expect([secondMatch.homePlayerId, secondMatch.awayPlayerId].sort()).toEqual(
      [groupB.standings[0]!.playerId, groupA.standings[1]!.playerId].sort(),
    )

    const firstBracketMatch = result.bracketMatches.find(
      (entry) => entry.bracketRound === BracketRound.SEMIFINAL && entry.bracketPosition === 1,
    )!

    expect(firstBracketMatch.homeSourceType).toBe(BracketSourceType.GROUP_POSITION)
    expect(firstBracketMatch.homeSourceRef).toBe('A:1')
    expect(firstBracketMatch.awaySourceRef).toBe('B:2')

    const phases = tournamentPhaseService.getTournamentPhases(tournament.id)
    expect(phases.find((phase) => phase.phaseType === TournamentPhaseType.GROUP_STAGE)?.status).toBe(
      'completed',
    )
    expect(tournamentPhaseService.getActivePhase(tournament.id)?.phaseType).toBe(
      TournamentPhaseType.KNOCKOUT,
    )
  })

  it('generates balanced knockout matches for four groups with top 2 qualifiers', () => {
    const { tournament } = setupGroupsKnockoutTournament(
      [
        'A1',
        'A2',
        'B1',
        'B2',
        'C1',
        'C2',
        'D1',
        'D2',
        'A3',
        'A4',
        'B3',
        'B4',
        'C3',
        'C4',
        'D3',
        'D4',
      ],
      4,
    )
    playAllGroupStageMatches(tournament.id)

    const groupStandings = groupStandingsService.getGroupStandings(tournament.id)
    const result = knockoutGenerationService.generateKnockout({
      tournamentId: tournament.id,
      qualifiersPerGroup: 2,
    })

    expect(result.firstRoundMatches).toHaveLength(4)
    expect(result.bracketMatches).toHaveLength(7)

    const expectedPairings = [
      ['A', 'B'],
      ['B', 'A'],
      ['C', 'D'],
      ['D', 'C'],
    ] as const

    for (const [index, [homeGroup, awayGroup]] of expectedPairings.entries()) {
      const match = result.firstRoundMatches.find((entry) => entry.bracketPosition === index + 1)!
      const homeStanding = groupStandings.find((group) => group.groupName === `Group ${homeGroup}`)!
      const awayStanding = groupStandings.find((group) => group.groupName === `Group ${awayGroup}`)!
      const homePlayerId = homeStanding.standings[0]!.playerId
      const awayPlayerId = awayStanding.standings[1]!.playerId

      expect([match.homePlayerId, match.awayPlayerId].sort()).toEqual(
        [homePlayerId, awayPlayerId].sort(),
      )
    }
  })

  it('requires all group stage matches to be played', () => {
    const { tournament } = setupGroupsKnockoutTournament(['A1', 'A2', 'B1', 'B2'], 2)

    expect(() =>
      knockoutGenerationService.generateKnockout({
        tournamentId: tournament.id,
        qualifiersPerGroup: 2,
      }),
    ).toThrow('All group stage matches must be played before generating knockout')
  })

  it('prevents generating knockout twice', () => {
    const { tournament } = setupGroupsKnockoutTournament(['A1', 'A2', 'B1', 'B2'], 2)
    playAllGroupStageMatches(tournament.id)

    knockoutGenerationService.generateKnockout({
      tournamentId: tournament.id,
      qualifiersPerGroup: 2,
    })

    expect(() =>
      knockoutGenerationService.generateKnockout({
        tournamentId: tournament.id,
        qualifiersPerGroup: 2,
      }),
    ).toThrow('Knockout has already been generated for this tournament')
  })

  it('rejects unsupported bracket sizes', () => {
    const { tournament } = setupGroupsKnockoutTournament(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], 3)
    playAllGroupStageMatches(tournament.id)

    expect(() =>
      knockoutGenerationService.generateKnockout({
        tournamentId: tournament.id,
        qualifiersPerGroup: 2,
      }),
    ).toThrow(ValidationError)
  })
})
