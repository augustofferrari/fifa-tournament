import { describe, expect, it } from 'vitest'
import type { Match } from '@shared/types/match'
import { EMPTY_MATCH_PHASE_FIELDS } from '@shared/types/match'
import { calculateHeadToHeadStats } from './head-to-head-stats.calculator'

const playerAId = 'p1'
const playerBId = 'p2'

const tournamentNamesById = new Map([
  ['t1', 'World Cup'],
  ['t2', 'League'],
])

function playedMatch(
  overrides: Partial<Match> & Pick<Match, 'id' | 'homePlayerId' | 'awayPlayerId' | 'homeGoals' | 'awayGoals'>,
): Match {
  return {
    ...EMPTY_MATCH_PHASE_FIELDS,
    tournamentId: 't1',
    roundNumber: 1,
    status: 'played',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('calculateHeadToHeadStats', () => {
  it('aggregates wins, draws, goals and last matches from both home/away fixtures', () => {
    const matches = [
      playedMatch({
        id: 'm1',
        tournamentId: 't1',
        roundNumber: 1,
        homePlayerId: playerAId,
        awayPlayerId: playerBId,
        homeGoals: 2,
        awayGoals: 1,
        updatedAt: '2026-01-03T00:00:00.000Z',
      }),
      playedMatch({
        id: 'm2',
        tournamentId: 't2',
        roundNumber: 2,
        homePlayerId: playerBId,
        awayPlayerId: playerAId,
        homeGoals: 3,
        awayGoals: 0,
        updatedAt: '2026-01-05T00:00:00.000Z',
      }),
      playedMatch({
        id: 'm3',
        tournamentId: 't1',
        roundNumber: 3,
        homePlayerId: playerAId,
        awayPlayerId: playerBId,
        homeGoals: 1,
        awayGoals: 1,
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
      playedMatch({
        id: 'm4',
        homePlayerId: playerAId,
        awayPlayerId: 'p3',
        homeGoals: 5,
        awayGoals: 0,
      }),
      {
        ...playedMatch({
          id: 'm5',
          homePlayerId: playerAId,
          awayPlayerId: playerBId,
          homeGoals: 1,
          awayGoals: 0,
        }),
        status: 'scheduled' as const,
        homeGoals: null,
        awayGoals: null,
      },
    ]

    const stats = calculateHeadToHeadStats({
      playerAId,
      playerBId,
      matches,
      tournamentNamesById,
    })

    expect(stats).toEqual({
      playerAId,
      playerBId,
      totalMatches: 3,
      playerAWins: 1,
      playerBWins: 1,
      draws: 1,
      playerAGoals: 3,
      playerBGoals: 5,
      lastMatches: [
        {
          tournamentName: 'League',
          roundNumber: 2,
          date: '2026-01-05T00:00:00.000Z',
          playerAGoals: 0,
          playerBGoals: 3,
          winnerPlayerId: playerBId,
        },
        {
          tournamentName: 'World Cup',
          roundNumber: 1,
          date: '2026-01-03T00:00:00.000Z',
          playerAGoals: 2,
          playerBGoals: 1,
          winnerPlayerId: playerAId,
        },
        {
          tournamentName: 'World Cup',
          roundNumber: 3,
          date: '2026-01-02T00:00:00.000Z',
          playerAGoals: 1,
          playerBGoals: 1,
          winnerPlayerId: null,
        },
      ],
    })
  })

  it('returns zeroed stats when there are no played head-to-head matches', () => {
    const stats = calculateHeadToHeadStats({
      playerAId,
      playerBId,
      matches: [],
      tournamentNamesById,
    })

    expect(stats).toEqual({
      playerAId,
      playerBId,
      totalMatches: 0,
      playerAWins: 0,
      playerBWins: 0,
      draws: 0,
      playerAGoals: 0,
      playerBGoals: 0,
      lastMatches: [],
    })
  })
})
