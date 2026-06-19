import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { ValidationError } from '../tournaments/tournament.validation'
import { TournamentFormat } from '@shared/types/tournament-format'
import { ValidationMessages } from '@shared/validation'
import { GroupGenerationService } from './group-generation.service'
import { GroupStageFixtureService } from './group-stage-fixture.service'
import { GroupStandingsService } from './group-standings.service'
import { TournamentGroupRepository } from './tournament-group.repository'

describe('GroupStandingsService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let tournamentPhaseService: TournamentPhaseService
  let tournamentGroupRepository: TournamentGroupRepository
  let groupGenerationService: GroupGenerationService
  let groupStageFixtureService: GroupStageFixtureService
  let groupStandingsService: GroupStandingsService
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
    groupStandingsService = new GroupStandingsService(
      db,
      tournamentRepository,
      tournamentGroupRepository,
      tournamentPhaseService,
      matchRepository,
      playerRepository,
    )
  })

  afterEach(() => {
    db.close()
  })

  function createGroupedTournamentWithFixtures(playerNames: string[], groupCount = 2) {
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
    groupStageFixtureService.generateFixture(tournament.id)

    return { tournament, players, playerIds }
  }

  it('returns standings per group using round robin rules', () => {
    const { tournament, players } = createGroupedTournamentWithFixtures([
      'Alpha One',
      'Alpha Two',
      'Alpha Three',
      'Beta One',
      'Beta Two',
      'Beta Three',
    ])

    const groups = tournamentGroupRepository.listGroupsByPhase(
      tournamentPhaseService
        .getTournamentPhases(tournament.id)
        .find((phase) => phase.phaseType === 'GROUP_STAGE')!.id,
    )
    const groupAId = groups[0]!.id
    const groupBId = groups[1]!.id

    const groupAPlayerIds = tournamentGroupRepository
      .listGroupPlayersByGroupId(groupAId)
      .map((entry) => entry.playerId)
    const groupBPlayerIds = tournamentGroupRepository
      .listGroupPlayersByGroupId(groupBId)
      .map((entry) => entry.playerId)

    const playerById = new Map(players.map((player) => [player.id, player]))
    const groupAPlayers = groupAPlayerIds.map((playerId) => playerById.get(playerId)!)
    const groupBPlayers = groupBPlayerIds.map((playerId) => playerById.get(playerId)!)

    const groupAMatch = matchRepository
      .listMatchesByTournament({ tournamentId: tournament.id })
      .find(
        (match) =>
          match.groupId === groupAId &&
          match.homePlayerId === groupAPlayers[0]!.id &&
          match.awayPlayerId === groupAPlayers[1]!.id,
      )!
    const groupBMatch = matchRepository
      .listMatchesByTournament({ tournamentId: tournament.id })
      .find(
        (match) =>
          match.groupId === groupBId &&
          match.homePlayerId === groupBPlayers[0]!.id &&
          match.awayPlayerId === groupBPlayers[1]!.id,
      )!

    matchRepository.updateMatchResult(groupAMatch.id, 2, 0)
    matchRepository.updateMatchResult(groupBMatch.id, 1, 1)

    const groupStandings = groupStandingsService.getGroupStandings(tournament.id)

    expect(groupStandings).toHaveLength(2)
    expect(groupStandings.map((entry) => entry.groupName)).toEqual(['Group A', 'Group B'])

    const groupAStandings = groupStandings.find((entry) => entry.groupId === groupAId)!
    const groupBStandings = groupStandings.find((entry) => entry.groupId === groupBId)!

    expect(groupAStandings.standings[0]).toEqual(
      expect.objectContaining({
        playerId: groupAPlayers[0]!.id,
        playerName: groupAPlayers[0]!.name,
        played: 1,
        won: 1,
        points: 3,
        goalsFor: 2,
        goalsAgainst: 0,
        goalDifference: 2,
      }),
    )

    const groupALoser = groupAStandings.standings.find((row) => row.playerId === groupAPlayers[1]!.id)
    expect(groupALoser).toEqual(
      expect.objectContaining({
        playerName: groupAPlayers[1]!.name,
        played: 1,
        won: 0,
        lost: 1,
        points: 0,
      }),
    )

    expect(groupBStandings.standings.every((row) => groupBPlayerIds.includes(row.playerId))).toBe(
      true,
    )
    expect(groupBStandings.standings.filter((row) => row.played === 1)).toHaveLength(2)
    expect(groupBStandings.standings.filter((row) => row.points === 1)).toHaveLength(2)
  })

  it('does not include cross-group results in a group standings table', () => {
    const { tournament, players } = createGroupedTournamentWithFixtures([
      'A1',
      'A2',
      'B1',
      'B2',
    ])

    const groups = tournamentGroupRepository.listGroupsByPhase(
      tournamentPhaseService
        .getTournamentPhases(tournament.id)
        .find((phase) => phase.phaseType === 'GROUP_STAGE')!.id,
    )
    const groupAPlayers = tournamentGroupRepository
      .listGroupPlayersByGroupId(groups[0]!.id)
      .map((entry) => entry.playerId)
    const groupBPlayers = tournamentGroupRepository
      .listGroupPlayersByGroupId(groups[1]!.id)
      .map((entry) => entry.playerId)

    const matches = matchRepository.listMatchesByTournament({ tournamentId: tournament.id })
    const groupAMatch = matches.find(
      (match) =>
        match.groupId === groups[0]!.id &&
        groupAPlayers.includes(match.homePlayerId) &&
        groupAPlayers.includes(match.awayPlayerId),
    )!
    const groupBMatch = matches.find(
      (match) =>
        match.groupId === groups[1]!.id &&
        groupBPlayers.includes(match.homePlayerId) &&
        groupBPlayers.includes(match.awayPlayerId),
    )!

    matchRepository.updateMatchResult(groupAMatch.id, 3, 0)
    matchRepository.updateMatchResult(groupBMatch.id, 0, 2)

    const groupStandings = groupStandingsService.getGroupStandings(tournament.id)
    const groupAStandings = groupStandings.find((entry) => entry.groupId === groups[0]!.id)!
    const groupBStandings = groupStandings.find((entry) => entry.groupId === groups[1]!.id)!

    expect(groupAStandings.standings.every((row) => groupAPlayers.includes(row.playerId))).toBe(true)
    expect(groupBStandings.standings.every((row) => groupBPlayers.includes(row.playerId))).toBe(true)
    expect(groupAStandings.standings.find((row) => row.playerId === players[2]!.id)).toBeUndefined()
    expect(players.length).toBe(4)
  })

  it('sorts tied players by name ascending', () => {
    const { tournament, players } = createGroupedTournamentWithFixtures([
      'Alice',
      'Bob',
      'Zara',
      'Carol',
    ])

    const groups = tournamentGroupRepository.listGroupsByPhase(
      tournamentPhaseService
        .getTournamentPhases(tournament.id)
        .find((phase) => phase.phaseType === 'GROUP_STAGE')!.id,
    )
    const groupAPlayerIds = tournamentGroupRepository
      .listGroupPlayersByGroupId(groups[0]!.id)
      .map((entry) => entry.playerId)
    const playerById = new Map(players.map((player) => [player.id, player]))
    const groupAPlayers = groupAPlayerIds.map((playerId) => playerById.get(playerId)!)

    expect(groupAPlayers.map((player) => player.name).sort()).toEqual(['Alice', 'Carol'])

    const headToHeadMatch = matchRepository
      .listMatchesByTournament({ tournamentId: tournament.id })
      .find(
        (match) =>
          match.groupId === groups[0]!.id &&
          groupAPlayerIds.includes(match.homePlayerId) &&
          groupAPlayerIds.includes(match.awayPlayerId),
      )!

    matchRepository.updateMatchResult(headToHeadMatch.id, 1, 1)

    const groupStandings = groupStandingsService.getGroupStandings(tournament.id)
    const names = groupStandings[0]!.standings
      .filter((row) => groupAPlayerIds.includes(row.playerId))
      .map((row) => row.playerName)

    expect(names).toEqual(['Alice', 'Carol'])
    expect(groupStandings[0]!.standings[0]?.points).toBe(1)
    expect(groupStandings[0]!.standings[1]?.points).toBe(1)
  })

  it('keeps removed players in group standings after deletion', () => {
    const { tournament, players } = createGroupedTournamentWithFixtures(['A1', 'A2', 'B1', 'B2'])

    const groups = tournamentGroupRepository.listGroupsByPhase(
      tournamentPhaseService
        .getTournamentPhases(tournament.id)
        .find((phase) => phase.phaseType === 'GROUP_STAGE')!.id,
    )
    const groupAPlayerIds = tournamentGroupRepository
      .listGroupPlayersByGroupId(groups[0]!.id)
      .map((entry) => entry.playerId)
    const removedPlayer = players.find((player) => groupAPlayerIds.includes(player.id))!
    const groupAMatch = matchRepository
      .listMatchesByTournament({ tournamentId: tournament.id })
      .find(
        (match) =>
          match.groupId === groups[0]!.id &&
          (match.homePlayerId === removedPlayer.id || match.awayPlayerId === removedPlayer.id),
      )!

    matchRepository.updateMatchResult(groupAMatch.id, 2, 1)
    playerRepository.deletePlayer(removedPlayer.id)

    const groupStandings = groupStandingsService.getGroupStandings(tournament.id)
    const removedStanding = groupStandings
      .flatMap((entry) => entry.standings)
      .find((row) => row.playerId === removedPlayer.id)

    expect(removedStanding?.playerName).toBe(ValidationMessages.removedPlayer)
    expect(removedStanding?.played).toBe(1)
  })

  it('returns an empty array for tournaments without a group stage', () => {
    const tournament = tournamentRepository.createTournament({ name: 'Round Robin Cup' })

    expect(groupStandingsService.getGroupStandings(tournament.id)).toEqual([])
  })

  it('throws when the tournament does not exist', () => {
    expect(() => groupStandingsService.getGroupStandings('missing-tournament')).toThrow(
      ValidationError,
    )
  })
})
