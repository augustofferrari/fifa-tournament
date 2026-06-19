import { describe, expect, it } from 'vitest'
import type { Match } from '@shared/types/match'
import { TournamentPhaseType, type TournamentPhase } from '@shared/types/tournament-phase'
import {
  areAllPhaseMatchesPlayed,
  getNextPhase,
  hasNextPhase,
} from './phase-completion.utils'

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
    phaseId: overrides.phaseId ?? 'phase-1',
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

describe('areAllPhaseMatchesPlayed', () => {
  it('returns false when the phase has no matches', () => {
    expect(areAllPhaseMatchesPlayed('phase-1', [])).toBe(false)
  })

  it('returns false when any match is unplayed', () => {
    const matches = [
      createMatch({ status: 'played', homeGoals: 1, awayGoals: 0 }),
      createMatch({ id: 'm2', status: 'scheduled' }),
    ]

    expect(areAllPhaseMatchesPlayed('phase-1', matches)).toBe(false)
  })

  it('returns true when every match in the phase is played', () => {
    const matches = [
      createMatch({ status: 'played', homeGoals: 1, awayGoals: 0 }),
      createMatch({ id: 'm2', status: 'played', homeGoals: 2, awayGoals: 2 }),
    ]

    expect(areAllPhaseMatchesPlayed('phase-1', matches)).toBe(true)
  })
})

describe('getNextPhase', () => {
  it('returns the next phase by order index', () => {
    const regularSeason = createPhase({
      id: 'rr',
      orderIndex: 1,
      phaseType: TournamentPhaseType.ROUND_ROBIN,
    })
    const playoffs = createPhase({
      id: 'po',
      orderIndex: 2,
      phaseType: TournamentPhaseType.PLAYOFF,
      status: 'pending',
    })

    expect(getNextPhase([regularSeason, playoffs], regularSeason)).toEqual(playoffs)
    expect(hasNextPhase([regularSeason, playoffs], regularSeason)).toBe(true)
    expect(hasNextPhase([regularSeason], regularSeason)).toBe(false)
  })
})
