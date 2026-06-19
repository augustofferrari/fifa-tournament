import Database from 'better-sqlite3'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { initializePreferencesService, preferencesService } from '@modules/app/preferences.service'
import { createSchemaTables } from '../../database/migrations/schema'
import { PlayerRepository } from '../players/player.repository'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { ValidationError } from '../tournaments/tournament.validation'
import { TournamentFormat } from '@shared/types/tournament-format'
import { translate } from '@shared/i18n'
import { GroupGenerationService } from './group-generation.service'
import { TournamentGroupRepository } from './tournament-group.repository'

describe('GroupGenerationService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let tournamentPhaseService: TournamentPhaseService
  let tournamentGroupRepository: TournamentGroupRepository
  let groupGenerationService: GroupGenerationService

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), 'mundial-test-'))
    initializePreferencesService(tempDir)
    preferencesService.setLocale('en')

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
  })

  afterEach(() => {
    db.close()
  })

  function createGroupStageTournament(playerNames: string[]) {
    const tournament = tournamentRepository.createTournament({
      name: 'Groups Cup',
      format: TournamentFormat.GROUPS_KNOCKOUT,
      groupCount: 2,
      playersPerGroup: 4,
      playoffQualifiedCount: 2,
    })
    const players = playerNames.map((name) => playerRepository.createPlayer({ name }))
    tournamentRepository.addPlayersToTournament(
      tournament.id,
      players.map((player) => player.id),
    )
    tournamentPhaseService.createPhasesForTournament(tournament.id)

    return {
      tournament,
      playerIds: players.map((player) => player.id),
    }
  }

  it('persists snake-distributed groups and players', () => {
    const { tournament, playerIds } = createGroupStageTournament([
      'Seed 1',
      'Seed 2',
      'Seed 3',
      'Seed 4',
      'Seed 5',
      'Seed 6',
      'Seed 7',
      'Seed 8',
    ])

    const result = groupGenerationService.generateGroups({
      tournamentId: tournament.id,
      groupCount: 2,
      playerIds,
    })

    expect(result.groups).toHaveLength(2)
    expect(result.groups.map((group) => group.name)).toEqual([
      translate('errors.groupName', 'en', { letter: 'A' }),
      translate('errors.groupName', 'en', { letter: 'B' }),
    ])
    expect(result.groups[0]?.players.map((player) => player.playerId)).toEqual([
      playerIds[0],
      playerIds[3],
      playerIds[4],
      playerIds[7],
    ])
    expect(result.groups[1]?.players.map((player) => player.playerId)).toEqual([
      playerIds[1],
      playerIds[2],
      playerIds[5],
      playerIds[6],
    ])

    const persistedGroups = tournamentGroupRepository.listGroupsByPhase(result.groups[0]!.phaseId)
    expect(persistedGroups).toHaveLength(2)
  })

  it('requires at least two groups', () => {
    const { tournament, playerIds } = createGroupStageTournament(['A', 'B', 'C', 'D'])

    expect(() =>
      groupGenerationService.generateGroups({
        tournamentId: tournament.id,
        groupCount: 1,
        playerIds,
      }),
    ).toThrow('groupCount must be at least 2')
  })

  it('requires enough players for all groups', () => {
    const { tournament, playerIds } = createGroupStageTournament(['A', 'B', 'C', 'D'])

    expect(() =>
      groupGenerationService.generateGroups({
        tournamentId: tournament.id,
        groupCount: 2,
        playerIds: playerIds.slice(0, 3),
      }),
    ).toThrow('At least 4 players are required for 2 groups')
  })

  it('rejects duplicate player ids', () => {
    const { tournament, playerIds } = createGroupStageTournament([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
    ])

    expect(() =>
      groupGenerationService.generateGroups({
        tournamentId: tournament.id,
        groupCount: 2,
        playerIds: [playerIds[0]!, playerIds[0]!, playerIds[2]!, playerIds[3]!],
      }),
    ).toThrow(ValidationError)
  })

  it('prevents generating groups twice for the same phase', () => {
    const { tournament, playerIds } = createGroupStageTournament([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
    ])

    groupGenerationService.generateGroups({
      tournamentId: tournament.id,
      groupCount: 2,
      playerIds,
    })

    expect(() =>
      groupGenerationService.generateGroups({
        tournamentId: tournament.id,
        groupCount: 2,
        playerIds,
      }),
    ).toThrow('Groups have already been generated for this phase')
  })
})
