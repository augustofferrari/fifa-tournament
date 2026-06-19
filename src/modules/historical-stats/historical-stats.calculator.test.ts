import { describe, expect, it } from 'vitest'
import type { Match } from '@shared/types/match'
import type { TournamentPlayerEntry } from '@shared/types/historical-stats'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import { calculateHistoricalStats } from './historical-stats.calculator'

const tournamentA: Tournament = {
  id: 't1',
  name: 'Cup A',
  status: 'active',
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const tournamentB: Tournament = {
  id: 't2',
  name: 'Cup B',
  status: 'active',
  pointsWin: 2,
  pointsDraw: 1,
  pointsLoss: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const players: Player[] = [
  {
    id: 'p1',
    name: 'Alice',
    nickname: null,
    teamName: null,
    photoPath: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p2',
    name: 'Bob',
    nickname: null,
    teamName: null,
    photoPath: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'p3',
    name: 'Charlie',
    nickname: null,
    teamName: null,
    photoPath: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

function playedMatch(
  id: string,
  tournamentId: string,
  homePlayerId: string,
  awayPlayerId: string,
  homeGoals: number,
  awayGoals: number,
): Match {
  return {
    id,
    tournamentId,
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

function scheduledMatch(
  id: string,
  tournamentId: string,
  homePlayerId: string,
  awayPlayerId: string,
): Match {
  return {
    id,
    tournamentId,
    roundNumber: 1,
    homePlayerId,
    awayPlayerId,
    homeGoals: null,
    awayGoals: null,
    status: 'scheduled',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('calculateHistoricalStats', () => {
  it('aggregates match stats across tournaments with their point rules', () => {
    const tournamentPlayers: TournamentPlayerEntry[] = [
      { tournamentId: 't1', playerId: 'p1' },
      { tournamentId: 't1', playerId: 'p2' },
      { tournamentId: 't2', playerId: 'p1' },
      { tournamentId: 't2', playerId: 'p3' },
    ]

    const matches = [
      playedMatch('m1', 't1', 'p1', 'p2', 2, 1),
      playedMatch('m2', 't2', 'p1', 'p3', 1, 1),
    ]

    const result = calculateHistoricalStats({
      players,
      tournaments: [tournamentA, tournamentB],
      tournamentPlayers,
      matches,
    })

    expect(result.players).toEqual([
      expect.objectContaining({
        playerId: 'p1',
        playerName: 'Alice',
        tournamentsPlayed: 2,
        tournamentsWon: 2,
        matchesPlayed: 2,
        wins: 1,
        draws: 1,
        losses: 0,
        goalsFor: 3,
        goalsAgainst: 2,
        goalDifference: 1,
        points: 4,
        winRate: 0.5,
      }),
      expect.objectContaining({
        playerId: 'p3',
        playerName: 'Charlie',
        tournamentsPlayed: 1,
        tournamentsWon: 0,
        matchesPlayed: 1,
        wins: 0,
        draws: 1,
        losses: 0,
        points: 1,
        winRate: 0,
      }),
      expect.objectContaining({
        playerId: 'p2',
        playerName: 'Bob',
        tournamentsPlayed: 1,
        tournamentsWon: 0,
        matchesPlayed: 1,
        wins: 0,
        draws: 0,
        losses: 1,
        points: 0,
        winRate: 0,
      }),
    ])
  })

  it('ignores scheduled matches and only awards wins when a tournament is complete', () => {
    const tournamentPlayers: TournamentPlayerEntry[] = [
      { tournamentId: 't1', playerId: 'p1' },
      { tournamentId: 't1', playerId: 'p2' },
    ]

    const matches = [
      playedMatch('m1', 't1', 'p1', 'p2', 1, 0),
      scheduledMatch('m2', 't1', 'p2', 'p1'),
    ]

    const result = calculateHistoricalStats({
      players: players.slice(0, 2),
      tournaments: [tournamentA],
      tournamentPlayers,
      matches,
    })

    expect(result.players).toEqual([
      expect.objectContaining({
        playerId: 'p1',
        tournamentsWon: 0,
        matchesPlayed: 1,
        wins: 1,
      }),
      expect.objectContaining({
        playerId: 'p2',
        tournamentsWon: 0,
        matchesPlayed: 1,
        losses: 1,
      }),
    ])
  })

  it('sorts by tournaments won, then points, goal difference, goals for, and name', () => {
    const tournamentC: Tournament = {
      id: 't3',
      name: 'Cup C',
      status: 'active',
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }

    const tournamentPlayers: TournamentPlayerEntry[] = [
      { tournamentId: 't1', playerId: 'p1' },
      { tournamentId: 't1', playerId: 'p2' },
      { tournamentId: 't2', playerId: 'p2' },
      { tournamentId: 't2', playerId: 'p3' },
      { tournamentId: 't3', playerId: 'p1' },
      { tournamentId: 't3', playerId: 'p3' },
    ]

    const matches = [
      playedMatch('m1', 't1', 'p1', 'p2', 1, 0),
      playedMatch('m2', 't2', 'p2', 'p3', 2, 0),
      playedMatch('m3', 't3', 'p1', 'p3', 1, 0),
    ]

    const result = calculateHistoricalStats({
      players,
      tournaments: [tournamentA, tournamentB, tournamentC],
      tournamentPlayers,
      matches,
    })

    expect(result.players.map((row) => row.playerId)).toEqual(['p1', 'p2', 'p3'])
    expect(result.players[0]).toEqual(
      expect.objectContaining({
        playerId: 'p1',
        tournamentsWon: 2,
      }),
    )
    expect(result.players[1]).toEqual(
      expect.objectContaining({
        playerId: 'p2',
        tournamentsWon: 1,
      }),
    )
  })

  it('returns zeroed stats for players without played matches', () => {
    const tournamentPlayers: TournamentPlayerEntry[] = [{ tournamentId: 't1', playerId: 'p3' }]

    const result = calculateHistoricalStats({
      players,
      tournaments: [tournamentA],
      tournamentPlayers,
      matches: [],
    })

    const charlie = result.players.find((row) => row.playerId === 'p3')

    expect(charlie).toEqual({
      playerId: 'p3',
      playerName: 'Charlie',
      tournamentsPlayed: 1,
      tournamentsWon: 0,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      winRate: 0,
    })
  })
})
