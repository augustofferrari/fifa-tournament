import { describe, expect, it } from 'vitest'
import type { Match } from '@shared/types/match'
import { EMPTY_MATCH_PHASE_FIELDS } from '@shared/types/match'
import { calculateAllPlayerStreaks, calculatePlayerStreaks } from './player-streaks.calculator'

const playerId = 'p1'
const opponentId = 'p2'

function playedMatch(
  overrides: Partial<Match> & Pick<Match, 'id' | 'homeGoals' | 'awayGoals' | 'updatedAt'>,
): Match {
  return {
    ...EMPTY_MATCH_PHASE_FIELDS,
    tournamentId: 't1',
    roundNumber: 1,
    homePlayerId: playerId,
    awayPlayerId: opponentId,
    status: 'played',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('calculatePlayerStreaks', () => {
  it('returns zero streaks when there are no played matches', () => {
    expect(
      calculatePlayerStreaks({
        playerId,
        matches: [],
      }),
    ).toEqual({
      playerId,
      currentWinStreak: 0,
      currentUnbeatenStreak: 0,
      currentLosingStreak: 0,
      bestWinStreak: 0,
      bestUnbeatenStreak: 0,
    })
  })

  it('calculates current streaks from the latest results in updated_at order', () => {
    const streaks = calculatePlayerStreaks({
      playerId,
      matches: [
        playedMatch({ id: 'm1', homeGoals: 2, awayGoals: 0, updatedAt: '2026-01-01T00:00:00.000Z' }),
        playedMatch({ id: 'm2', homeGoals: 1, awayGoals: 1, updatedAt: '2026-01-02T00:00:00.000Z' }),
        playedMatch({ id: 'm3', homeGoals: 3, awayGoals: 1, updatedAt: '2026-01-03T00:00:00.000Z' }),
        playedMatch({ id: 'm4', homeGoals: 2, awayGoals: 0, updatedAt: '2026-01-04T00:00:00.000Z' }),
      ],
    })

    expect(streaks).toEqual({
      playerId,
      currentWinStreak: 2,
      currentUnbeatenStreak: 4,
      currentLosingStreak: 0,
      bestWinStreak: 2,
      bestUnbeatenStreak: 4,
    })
  })

  it('tracks best streaks separately from the current run', () => {
    const streaks = calculatePlayerStreaks({
      playerId,
      matches: [
        playedMatch({ id: 'm1', homeGoals: 2, awayGoals: 0, updatedAt: '2026-01-01T00:00:00.000Z' }),
        playedMatch({ id: 'm2', homeGoals: 1, awayGoals: 0, updatedAt: '2026-01-02T00:00:00.000Z' }),
        playedMatch({ id: 'm3', homeGoals: 1, awayGoals: 0, updatedAt: '2026-01-03T00:00:00.000Z' }),
        playedMatch({ id: 'm4', homeGoals: 0, awayGoals: 2, updatedAt: '2026-01-04T00:00:00.000Z' }),
        playedMatch({ id: 'm5', homeGoals: 2, awayGoals: 1, updatedAt: '2026-01-05T00:00:00.000Z' }),
      ],
    })

    expect(streaks.currentWinStreak).toBe(1)
    expect(streaks.currentUnbeatenStreak).toBe(1)
    expect(streaks.currentLosingStreak).toBe(0)
    expect(streaks.bestWinStreak).toBe(3)
    expect(streaks.bestUnbeatenStreak).toBe(3)
  })

  it('counts current and best losing streaks', () => {
    const streaks = calculatePlayerStreaks({
      playerId,
      matches: [
        playedMatch({ id: 'm1', homeGoals: 0, awayGoals: 1, updatedAt: '2026-01-01T00:00:00.000Z' }),
        playedMatch({ id: 'm2', homeGoals: 1, awayGoals: 2, updatedAt: '2026-01-02T00:00:00.000Z' }),
        playedMatch({ id: 'm3', homeGoals: 2, awayGoals: 0, updatedAt: '2026-01-03T00:00:00.000Z' }),
        playedMatch({ id: 'm4', homeGoals: 0, awayGoals: 3, updatedAt: '2026-01-04T00:00:00.000Z' }),
        playedMatch({ id: 'm5', homeGoals: 1, awayGoals: 4, updatedAt: '2026-01-05T00:00:00.000Z' }),
      ],
    })

    expect(streaks.currentWinStreak).toBe(0)
    expect(streaks.currentUnbeatenStreak).toBe(0)
    expect(streaks.currentLosingStreak).toBe(2)
    expect(streaks.bestWinStreak).toBe(1)
    expect(streaks.bestUnbeatenStreak).toBe(1)
  })

  it('sorts matches by updated_at before calculating streaks', () => {
    const streaks = calculatePlayerStreaks({
      playerId,
      matches: [
        playedMatch({ id: 'm3', homeGoals: 2, awayGoals: 0, updatedAt: '2026-01-03T00:00:00.000Z' }),
        playedMatch({ id: 'm1', homeGoals: 0, awayGoals: 1, updatedAt: '2026-01-01T00:00:00.000Z' }),
        playedMatch({ id: 'm2', homeGoals: 0, awayGoals: 2, updatedAt: '2026-01-02T00:00:00.000Z' }),
      ],
    })

    expect(streaks.currentWinStreak).toBe(1)
    expect(streaks.currentLosingStreak).toBe(0)
    expect(streaks.bestWinStreak).toBe(1)
  })

  it('ignores scheduled matches and matches where the player did not participate', () => {
    const streaks = calculatePlayerStreaks({
      playerId,
      matches: [
        playedMatch({ id: 'm1', homeGoals: 2, awayGoals: 0, updatedAt: '2026-01-01T00:00:00.000Z' }),
        {
          ...playedMatch({ id: 'm2', homeGoals: null, awayGoals: null, updatedAt: '2026-01-02T00:00:00.000Z' }),
          status: 'scheduled',
        },
        {
          ...playedMatch({ id: 'm3', homeGoals: 1, awayGoals: 0, updatedAt: '2026-01-03T00:00:00.000Z' }),
          homePlayerId: 'other-a',
          awayPlayerId: 'other-b',
        },
      ],
    })

    expect(streaks.currentWinStreak).toBe(1)
    expect(streaks.bestWinStreak).toBe(1)
  })

  it('calculates streaks for all players in one pass', () => {
    const matches = [
      playedMatch({ id: 'm1', homeGoals: 2, awayGoals: 0, updatedAt: '2026-01-01T00:00:00.000Z' }),
      playedMatch({ id: 'm2', homeGoals: 1, awayGoals: 1, updatedAt: '2026-01-02T00:00:00.000Z' }),
      {
        ...playedMatch({ id: 'm3', homeGoals: 0, awayGoals: 2, updatedAt: '2026-01-03T00:00:00.000Z' }),
        homePlayerId: opponentId,
        awayPlayerId: 'p3',
      },
    ]

    const streaks = calculateAllPlayerStreaks([playerId, opponentId, 'p3'], matches)
    const byId = new Map(streaks.map((entry) => [entry.playerId, entry]))

    expect(byId.get(playerId)).toEqual({
      playerId,
      currentWinStreak: 0,
      currentUnbeatenStreak: 2,
      currentLosingStreak: 0,
      bestWinStreak: 1,
      bestUnbeatenStreak: 2,
    })
    expect(byId.get(opponentId)).toEqual({
      playerId: opponentId,
      currentWinStreak: 0,
      currentUnbeatenStreak: 0,
      currentLosingStreak: 1,
      bestWinStreak: 0,
      bestUnbeatenStreak: 1,
    })
    expect(byId.get('p3')).toEqual({
      playerId: 'p3',
      currentWinStreak: 1,
      currentUnbeatenStreak: 1,
      currentLosingStreak: 0,
      bestWinStreak: 1,
      bestUnbeatenStreak: 1,
    })
  })
})
