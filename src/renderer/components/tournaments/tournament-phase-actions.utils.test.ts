import { describe, expect, it } from 'vitest'
import type { Match } from '@shared/types/match'
import type { Tournament } from '@shared/types/tournament'
import { TournamentFormat } from '@shared/types/tournament-format'
import { TournamentPhaseType, type TournamentPhase } from '@shared/types/tournament-phase'
import {
  getGenerateKnockoutActionState,
  getGeneratePlayoffsActionState,
} from './tournament-phase-actions.utils'

function createPhase(overrides: Partial<TournamentPhase>): TournamentPhase {
  return {
    id: overrides.id ?? 'phase-1',
    tournamentId: overrides.tournamentId ?? 't1',
    phaseType: overrides.phaseType ?? TournamentPhaseType.ROUND_ROBIN,
    name: overrides.name ?? 'Phase',
    orderIndex: overrides.orderIndex ?? 1,
    status: overrides.status ?? 'active',
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
  }
}

function createMatch(overrides: Partial<Match>): Match {
  return {
    id: overrides.id ?? 'm1',
    tournamentId: overrides.tournamentId ?? 't1',
    phaseId: overrides.phaseId ?? 'rr',
    groupId: overrides.groupId ?? null,
    bracketRound: overrides.bracketRound ?? null,
    bracketPosition: overrides.bracketPosition ?? null,
    roundNumber: overrides.roundNumber ?? 1,
    homePlayerId: overrides.homePlayerId ?? 'p1',
    awayPlayerId: overrides.awayPlayerId ?? 'p2',
    homeGoals: overrides.homeGoals ?? null,
    awayGoals: overrides.awayGoals ?? null,
    status: overrides.status ?? 'scheduled',
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
  }
}

function createTournament(format: TournamentFormat): Tournament {
  return {
    id: 't1',
    name: 'Cup',
    status: 'active',
    format,
    hasGroupStage: format === TournamentFormat.GROUPS_KNOCKOUT,
    hasPlayoffs: format === TournamentFormat.ROUND_ROBIN_PLAYOFFS,
    hasKnockoutStage:
      format === TournamentFormat.GROUPS_KNOCKOUT ||
      format === TournamentFormat.KNOCKOUT_ONLY,
    playoffQualifiedCount: 4,
    groupCount: format === TournamentFormat.GROUPS_KNOCKOUT ? 2 : null,
    playersPerGroup: format === TournamentFormat.GROUPS_KNOCKOUT ? 4 : null,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    resultsUnlocked: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('tournament phase actions utils', () => {
  it('enables playoffs only when all round robin matches are played', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN_PLAYOFFS)
    const roundRobinPhase = createPhase({
      id: 'rr',
      phaseType: TournamentPhaseType.ROUND_ROBIN,
      status: 'active',
    })
    const playoffPhase = createPhase({
      id: 'po',
      phaseType: TournamentPhaseType.PLAYOFF,
      status: 'pending',
      orderIndex: 2,
    })
    const matches = [
      createMatch({ id: 'm1', phaseId: 'rr', status: 'played', homeGoals: 1, awayGoals: 0 }),
      createMatch({ id: 'm2', phaseId: 'rr', status: 'scheduled' }),
    ]

    expect(
      getGeneratePlayoffsActionState(tournament, [roundRobinPhase, playoffPhase], roundRobinPhase, matches),
    ).toMatchObject({
      visible: true,
      enabled: false,
      hint: expect.stringContaining('1 remaining'),
    })

    matches[1] = {
      ...matches[1]!,
      status: 'played',
      homeGoals: 2,
      awayGoals: 1,
    }

    expect(
      getGeneratePlayoffsActionState(tournament, [roundRobinPhase, playoffPhase], roundRobinPhase, matches),
    ).toMatchObject({
      visible: true,
      enabled: true,
      hint: null,
    })
  })

  it('shows generate playoffs when the regular season phase is completed', () => {
    const tournament = createTournament(TournamentFormat.ROUND_ROBIN_PLAYOFFS)
    const roundRobinPhase = createPhase({
      id: 'rr',
      phaseType: TournamentPhaseType.ROUND_ROBIN,
      status: 'completed',
    })
    const playoffPhase = createPhase({
      id: 'po',
      phaseType: TournamentPhaseType.PLAYOFF,
      status: 'pending',
      orderIndex: 2,
    })
    const matches = [
      createMatch({ id: 'm1', phaseId: 'rr', status: 'played', homeGoals: 1, awayGoals: 0 }),
    ]

    expect(
      getGeneratePlayoffsActionState(tournament, [roundRobinPhase, playoffPhase], roundRobinPhase, matches),
    ).toMatchObject({
      visible: true,
      enabled: true,
      hint: null,
    })
  })

  it('enables knockout only when all group matches are played', () => {
    const tournament = createTournament(TournamentFormat.GROUPS_KNOCKOUT)
    const groupPhase = createPhase({
      id: 'gs',
      phaseType: TournamentPhaseType.GROUP_STAGE,
      status: 'active',
    })
    const knockoutPhase = createPhase({
      id: 'ko',
      phaseType: TournamentPhaseType.KNOCKOUT,
      status: 'pending',
      orderIndex: 2,
    })
    const matches = [
      createMatch({ id: 'm1', phaseId: 'gs', status: 'played', homeGoals: 1, awayGoals: 1 }),
    ]

    expect(
      getGenerateKnockoutActionState(tournament, [groupPhase, knockoutPhase], groupPhase, matches),
    ).toMatchObject({
      visible: true,
      enabled: true,
      hint: null,
    })
  })
})
