import { describe, expect, it } from 'vitest'
import type { LatestMatchResult } from '@shared/types/latest-match-result'
import type { Match } from '@shared/types/match'
import { TournamentPhaseType, type TournamentPhase } from '@shared/types/tournament-phase'
import {
  filterLatestResultsForTournament,
  getNextMatchesForPhase,
  isBracketPhase,
  resolveDisplayPhase,
} from './tv-mode.utils'

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

describe('resolveDisplayPhase', () => {
  it('prefers the active phase', () => {
    const phases = [
      createPhase({ id: 'rr', orderIndex: 1, status: 'completed' }),
      createPhase({
        id: 'po',
        orderIndex: 2,
        phaseType: TournamentPhaseType.PLAYOFF,
        status: 'active',
      }),
    ]

    expect(resolveDisplayPhase(phases)?.id).toBe('po')
  })
})

describe('filterLatestResultsForTournament', () => {
  it('returns only results for the requested tournament', () => {
    const results: LatestMatchResult[] = [
      {
        matchId: 'm1',
        tournamentId: 't1',
        tournamentName: 'Cup A',
        homePlayerId: 'p1',
        homePlayerName: 'A',
        awayPlayerId: 'p2',
        awayPlayerName: 'B',
        homeGoals: 1,
        awayGoals: 0,
        playedAt: '2026-01-01T00:00:00.000Z',
        roundNumber: 1,
      },
      {
        matchId: 'm2',
        tournamentId: 't2',
        tournamentName: 'Cup B',
        homePlayerId: 'p3',
        homePlayerName: 'C',
        awayPlayerId: 'p4',
        awayPlayerName: 'D',
        homeGoals: 2,
        awayGoals: 2,
        playedAt: '2026-01-02T00:00:00.000Z',
        roundNumber: 1,
      },
    ]

    expect(filterLatestResultsForTournament(results, 't1')).toHaveLength(1)
    expect(filterLatestResultsForTournament(results, 't1')[0]?.matchId).toBe('m1')
  })
})

describe('getNextMatchesForPhase', () => {
  it('returns scheduled matches for the selected phase only', () => {
    const phase = createPhase({ id: 'rr' })
    const matches: Match[] = [
      {
        id: 'm1',
        tournamentId: 't1',
        phaseId: 'rr',
        groupId: null,
        bracketRound: null,
        bracketPosition: null,
        roundNumber: 1,
        homePlayerId: 'p1',
        awayPlayerId: 'p2',
        homeGoals: null,
        awayGoals: null,
        status: 'scheduled',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'm2',
        tournamentId: 't1',
        phaseId: 'other',
        groupId: null,
        bracketRound: null,
        bracketPosition: null,
        roundNumber: 1,
        homePlayerId: 'p3',
        awayPlayerId: 'p4',
        homeGoals: null,
        awayGoals: null,
        status: 'scheduled',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    expect(getNextMatchesForPhase(matches, phase)).toEqual([matches[0]])
  })
})

describe('isBracketPhase', () => {
  it('detects playoff and knockout phases', () => {
    expect(isBracketPhase(TournamentPhaseType.PLAYOFF)).toBe(true)
    expect(isBracketPhase(TournamentPhaseType.KNOCKOUT)).toBe(true)
    expect(isBracketPhase(TournamentPhaseType.ROUND_ROBIN)).toBe(false)
  })
})
