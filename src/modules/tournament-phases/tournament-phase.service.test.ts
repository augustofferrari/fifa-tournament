import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { PlayerRepository } from '../players/player.repository'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { ValidationError } from '../tournaments/tournament.validation'
import { TournamentFormat } from '@shared/types/tournament-format'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { TournamentPhaseRepository } from './tournament-phase.repository'
import { TournamentPhaseService } from './tournament-phase.service'

describe('TournamentPhaseService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let tournamentPhaseRepository: TournamentPhaseRepository
  let tournamentPhaseService: TournamentPhaseService

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    tournamentPhaseRepository = new TournamentPhaseRepository(db)
    tournamentPhaseService = new TournamentPhaseService(
      db,
      tournamentRepository,
      tournamentPhaseRepository,
    )
  })

  afterEach(() => {
    db.close()
  })

  function createTournament(format = TournamentFormat.ROUND_ROBIN) {
    const tournament = tournamentRepository.createTournament({
      name: 'Test Cup',
      format,
      ...(format === TournamentFormat.ROUND_ROBIN_PLAYOFFS
        ? { playoffQualifiedCount: 2 }
        : {}),
      ...(format === TournamentFormat.GROUPS_KNOCKOUT
        ? { groupCount: 2, playersPerGroup: 2, playoffQualifiedCount: 1 }
        : {}),
    })
    const minimumPlayers =
      format === TournamentFormat.GROUPS_KNOCKOUT
        ? 4
        : format === TournamentFormat.ROUND_ROBIN_PLAYOFFS
          ? 3
          : 2
    const players = Array.from({ length: minimumPlayers }, (_, index) =>
      playerRepository.createPlayer({ name: `Player ${index + 1}` }),
    )
    tournamentRepository.addPlayersToTournament(
      tournament.id,
      players.map((player) => player.id),
    )
    return tournament
  }

  it('creates one round robin phase for ROUND_ROBIN tournaments', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN)

    const phases = tournamentPhaseService.createPhasesForTournament(tournament.id)

    expect(phases).toHaveLength(1)
    expect(phases[0]).toMatchObject({
      phaseType: TournamentPhaseType.ROUND_ROBIN,
      name: 'Regular Season',
      orderIndex: 1,
      status: 'active',
    })
  })

  it('creates round robin and playoff phases for ROUND_ROBIN_PLAYOFFS tournaments', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN_PLAYOFFS)

    const phases = tournamentPhaseService.createPhasesForTournament(tournament.id)

    expect(phases.map((phase) => phase.phaseType)).toEqual([
      TournamentPhaseType.ROUND_ROBIN,
      TournamentPhaseType.PLAYOFF,
    ])
    expect(phases.map((phase) => phase.status)).toEqual(['active', 'pending'])
  })

  it('creates group stage and knockout phases for GROUPS_KNOCKOUT tournaments', () => {
    const tournament = createTournament(TournamentFormat.GROUPS_KNOCKOUT)

    const phases = tournamentPhaseService.createPhasesForTournament(tournament.id)

    expect(phases.map((phase) => phase.phaseType)).toEqual([
      TournamentPhaseType.GROUP_STAGE,
      TournamentPhaseType.KNOCKOUT,
    ])
    expect(phases[0]?.name).toBe('Group Stage')
    expect(phases[1]?.name).toBe('Knockout')
  })

  it('creates one knockout phase for KNOCKOUT_ONLY tournaments', () => {
    const tournament = createTournament(TournamentFormat.KNOCKOUT_ONLY)

    const phases = tournamentPhaseService.createPhasesForTournament(tournament.id)

    expect(phases).toHaveLength(1)
    expect(phases[0]).toMatchObject({
      phaseType: TournamentPhaseType.KNOCKOUT,
      orderIndex: 1,
      status: 'active',
    })
  })

  it('lists phases in order and returns the active phase', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN_PLAYOFFS)
    tournamentPhaseService.createPhasesForTournament(tournament.id)

    const phases = tournamentPhaseService.getTournamentPhases(tournament.id)
    const activePhase = tournamentPhaseService.getActivePhase(tournament.id)

    expect(phases).toHaveLength(2)
    expect(phases[0]?.orderIndex).toBeLessThan(phases[1]?.orderIndex ?? 0)
    expect(activePhase?.phaseType).toBe(TournamentPhaseType.ROUND_ROBIN)
  })

  it('completes the active phase and activates the next pending phase', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN_PLAYOFFS)
    const [regularSeason] = tournamentPhaseService.createPhasesForTournament(tournament.id)

    const completed = tournamentPhaseService.completePhase(regularSeason!.id)
    const playoffs = tournamentPhaseService.activateNextPhase(tournament.id)

    expect(completed.status).toBe('completed')
    expect(playoffs).toMatchObject({
      phaseType: TournamentPhaseType.PLAYOFF,
      status: 'active',
      orderIndex: 2,
    })
    expect(tournamentPhaseService.getActivePhase(tournament.id)?.id).toBe(playoffs.id)
  })

  it('allows completing an already completed phase', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN)
    const [regularSeason] = tournamentPhaseService.createPhasesForTournament(tournament.id)

    tournamentPhaseService.completePhase(regularSeason!.id)

    expect(() => tournamentPhaseService.completePhase(regularSeason!.id)).not.toThrow()
    expect(
      tournamentPhaseService.getTournamentPhases(tournament.id)[0]?.status,
    ).toBe('completed')
  })

  it('finishes the tournament when the last phase is auto-completed', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN)
    const [regularSeason] = tournamentPhaseService.createPhasesForTournament(tournament.id)

    tournamentPhaseService.tryAutoCompletePhaseAfterMatchResult(
      tournament.id,
      regularSeason!.id,
      true,
    )

    expect(
      tournamentPhaseService.getTournamentPhases(tournament.id)[0]?.status,
    ).toBe('completed')
    expect(tournamentRepository.getTournamentById(tournament.id)?.status).toBe('finished')
  })

  it('keeps the next phase pending when auto-completing an intermediate phase', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN_PLAYOFFS)
    const [regularSeason, playoffs] = tournamentPhaseService.createPhasesForTournament(tournament.id)

    tournamentPhaseService.tryAutoCompletePhaseAfterMatchResult(
      tournament.id,
      regularSeason!.id,
      true,
    )

    const phases = tournamentPhaseService.getTournamentPhases(tournament.id)
    expect(phases.find((phase) => phase.id === regularSeason!.id)?.status).toBe('completed')
    expect(phases.find((phase) => phase.id === playoffs!.id)?.status).toBe('pending')
    expect(tournamentRepository.getTournamentById(tournament.id)?.status).toBe('active')
    expect(tournamentPhaseService.getActivePhase(tournament.id)).toBeNull()
  })

  it('does not auto-complete when matches remain unplayed', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN)
    const [regularSeason] = tournamentPhaseService.createPhasesForTournament(tournament.id)

    tournamentPhaseService.tryAutoCompletePhaseAfterMatchResult(
      tournament.id,
      regularSeason!.id,
      false,
    )

    expect(
      tournamentPhaseService.getTournamentPhases(tournament.id)[0]?.status,
    ).toBe('active')
    expect(tournamentRepository.getTournamentById(tournament.id)?.status).toBe('draft')
  })

  it('prevents creating phases twice', () => {
    const tournament = createTournament()
    tournamentPhaseService.createPhasesForTournament(tournament.id)

    expect(() => tournamentPhaseService.createPhasesForTournament(tournament.id)).toThrow(
      ValidationError,
    )
  })

  it('prevents activating the next phase while another is active', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN_PLAYOFFS)
    tournamentPhaseService.createPhasesForTournament(tournament.id)

    expect(() => tournamentPhaseService.activateNextPhase(tournament.id)).toThrow(
      'Complete the active phase before activating the next one',
    )
  })
})
