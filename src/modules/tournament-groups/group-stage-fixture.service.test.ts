import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { generateRoundRobinFixtures } from '../fixtures/round-robin.fixture'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { ValidationError } from '../tournaments/tournament.validation'
import { TournamentFormat } from '@shared/types/tournament-format'
import { ValidationMessages } from '@shared/validation'
import { translate } from '@shared/i18n'
import { GroupGenerationService } from './group-generation.service'
import { GroupStageFixtureService } from './group-stage-fixture.service'
import { TournamentGroupRepository } from './tournament-group.repository'

describe('GroupStageFixtureService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let tournamentPhaseService: TournamentPhaseService
  let tournamentGroupRepository: TournamentGroupRepository
  let groupGenerationService: GroupGenerationService
  let groupStageFixtureService: GroupStageFixtureService
  let matchRepository: MatchRepository

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
  })

  afterEach(() => {
    db.close()
  })

  function createGroupedTournament(playerNames: string[], groupCount = 2) {
    const tournament = tournamentRepository.createTournament({
      name: 'Groups Cup',
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

    return { tournament, playerIds }
  }

  it('persists round robin matches per group with phase and group metadata', () => {
    const { tournament, playerIds } = createGroupedTournament([
      'A1',
      'A2',
      'A3',
      'A4',
      'B1',
      'B2',
      'B3',
    ])

    const groups = tournamentGroupRepository.listGroupsByPhase(
      tournamentPhaseService.getActivePhase(tournament.id)!.id,
    )
    const groupAPlayers = tournamentGroupRepository
      .listGroupPlayersByGroupId(groups[0]!.id)
      .map((player) => player.playerId)
    const groupBPlayers = tournamentGroupRepository
      .listGroupPlayersByGroupId(groups[1]!.id)
      .map((player) => player.playerId)

    const expectedMatchCount =
      generateRoundRobinFixtures(groupAPlayers).length +
      generateRoundRobinFixtures(groupBPlayers).length

    const matches = groupStageFixtureService.generateFixture(tournament.id)

    expect(matches).toHaveLength(expectedMatchCount)
    expect(matches.every((match) => match.status === 'scheduled')).toBe(true)
    expect(matches.every((match) => match.tournamentId === tournament.id)).toBe(true)
    expect(matches.every((match) => match.phaseId !== null)).toBe(true)
    expect(matches.every((match) => match.groupId !== null)).toBe(true)

    const groupAId = groups[0]!.id
    const groupBId = groups[1]!.id
    const groupAMatches = matches.filter((match) => match.groupId === groupAId)
    const groupBMatches = matches.filter((match) => match.groupId === groupBId)

    expect(groupAMatches).toHaveLength(generateRoundRobinFixtures(groupAPlayers).length)
    expect(groupBMatches).toHaveLength(generateRoundRobinFixtures(groupBPlayers).length)

    for (const match of groupAMatches) {
      expect(groupAPlayers).toContain(match.homePlayerId)
      expect(groupAPlayers).toContain(match.awayPlayerId)
    }

    for (const match of groupBMatches) {
      expect(groupBPlayers).toContain(match.homePlayerId)
      expect(groupBPlayers).toContain(match.awayPlayerId)
    }

    expect(tournamentRepository.getTournamentById(tournament.id)?.status).toBe('active')
    expect(playerIds.length).toBeGreaterThan(0)
  })

  it('supports odd-sized groups using internal BYE without persisting bye matches', () => {
    const { tournament } = createGroupedTournament(['A1', 'A2', 'A3', 'B1', 'B2', 'B3'])

    const groups = tournamentGroupRepository.listGroupsByPhase(
      tournamentPhaseService.getActivePhase(tournament.id)!.id,
    )
    const groupBPlayers = tournamentGroupRepository
      .listGroupPlayersByGroupId(groups[1]!.id)
      .map((player) => player.playerId)

    const matches = groupStageFixtureService.generateFixture(tournament.id)
    const groupBMatches = matches.filter((match) => match.groupId === groups[1]!.id)

    expect(groupBMatches).toHaveLength(generateRoundRobinFixtures(groupBPlayers).length)
    expect(groupBMatches).toHaveLength(3)
  })

  it('requires groups to exist before generating fixtures', () => {
    const tournament = tournamentRepository.createTournament({
      name: 'Empty Groups Cup',
      format: TournamentFormat.GROUPS_KNOCKOUT,
      groupCount: 2,
      playersPerGroup: 2,
      playoffQualifiedCount: 2,
    })
    tournamentPhaseService.createPhasesForTournament(tournament.id)

    expect(() => groupStageFixtureService.generateFixture(tournament.id)).toThrow(
      'Groups must be generated before creating group stage fixtures',
    )
  })

  it('prevents generating fixtures twice for the same phase', () => {
    const { tournament } = createGroupedTournament(['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'])

    groupStageFixtureService.generateFixture(tournament.id)

    expect(() => groupStageFixtureService.generateFixture(tournament.id)).toThrow(ValidationError)
    expect(() => groupStageFixtureService.generateFixture(tournament.id)).toThrow(
      translate(ValidationMessages.fixtureAlreadyGenerated, 'en'),
    )
  })
})
