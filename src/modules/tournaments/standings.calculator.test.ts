import { describe, expect, it } from 'vitest'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import { calculateStandings } from './standings.calculator'

const tournament: Tournament = {
  id: 't1',
  name: 'Test',
  status: 'active',
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const players: Player[] = [
  {
    id: 'p1',
    name: 'Charlie',
    nickname: null,
    teamName: null,
    photoPath: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p2',
    name: 'Alice',
    nickname: null,
    teamName: null,
    photoPath: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p3',
    name: 'Bob',
    nickname: null,
    teamName: null,
    photoPath: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

function playedMatch(
  id: string,
  homePlayerId: string,
  awayPlayerId: string,
  homeGoals: number,
  awayGoals: number,
): Match {
  return {
    id,
    tournamentId: tournament.id,
    roundNumber: 1,
    homePlayerId,
    awayPlayerId,
    homeGoals,
    awayGoals,
    status: 'played',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('calculateStandings', () => {
  it('calculates stats from played matches only', () => {
    const matches = [
      playedMatch('m1', 'p1', 'p2', 2, 1),
      playedMatch('m2', 'p3', 'p1', 0, 0),
      {
        ...playedMatch('m3', 'p2', 'p3', 1, 0),
        status: 'scheduled' as const,
        homeGoals: null,
        awayGoals: null,
      },
    ]

    const standings = calculateStandings(players, matches, tournament)

    expect(standings).toEqual([
      expect.objectContaining({
        playerId: 'p1',
        playerName: 'Charlie',
        played: 2,
        won: 1,
        drawn: 1,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 1,
        goalDifference: 1,
        points: 4,
      }),
      expect.objectContaining({
        playerId: 'p3',
        playerName: 'Bob',
        played: 1,
        won: 0,
        drawn: 1,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 1,
      }),
      expect.objectContaining({
        playerId: 'p2',
        playerName: 'Alice',
        played: 1,
        won: 0,
        drawn: 0,
        lost: 1,
        goalsFor: 1,
        goalsAgainst: 2,
        goalDifference: -1,
        points: 0,
      }),
    ])
  })

  it('sorts by points, goal difference, goals for, then player name', () => {
    const tiedPlayers: Player[] = [
      { ...players[0]!, id: 'p1', name: 'Zara' },
      { ...players[1]!, id: 'p2', name: 'Alice' },
    ]

    const matches = [
      playedMatch('m1', 'p1', 'p2', 2, 0),
      playedMatch('m2', 'p2', 'p1', 2, 0),
    ]

    const standings = calculateStandings(tiedPlayers, matches, tournament)

    expect(standings.map((row) => row.playerName)).toEqual(['Alice', 'Zara'])
    expect(standings[0]?.points).toBe(3)
    expect(standings[1]?.points).toBe(3)
  })
})
