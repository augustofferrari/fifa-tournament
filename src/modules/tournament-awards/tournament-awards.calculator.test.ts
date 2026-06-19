import { describe, expect, it } from 'vitest'
import type { Match } from '@shared/types/match'
import { EMPTY_MATCH_PHASE_FIELDS } from '@shared/types/match'
import type { StandingRow } from '@shared/types/standings'
import { calculateStandings } from '@modules/tournaments/standings.calculator'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import { DEFAULT_TOURNAMENT_FORMAT_CONFIG } from '@shared/types/tournament-format'
import { calculateTournamentAwards } from './tournament-awards.calculator'

const tournament: Tournament = {
  id: 't1',
  name: 'World Cup',
  status: 'active',
  resultsUnlocked: false,
  ...DEFAULT_TOURNAMENT_FORMAT_CONFIG,
  pointsWin: 3,
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
  homePlayerId: string,
  awayPlayerId: string,
  homeGoals: number,
  awayGoals: number,
  roundNumber = 1,
): Match {
  return {
    ...EMPTY_MATCH_PHASE_FIELDS,
    id,
    tournamentId: tournament.id,
    roundNumber,
    homePlayerId,
    awayPlayerId,
    homeGoals,
    awayGoals,
    status: 'played',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('calculateTournamentAwards', () => {
  it('calculates all awards from standings and played matches', () => {
    const matches = [
      playedMatch('m1', 'p1', 'p2', 4, 0, 1),
      playedMatch('m2', 'p1', 'p3', 1, 1, 2),
      playedMatch('m3', 'p2', 'p3', 2, 0, 3),
    ]

    const standings = calculateStandings(players, matches, tournament)

    const awards = calculateTournamentAwards({
      tournamentId: tournament.id,
      standings,
      matches,
    })

    expect(awards).toEqual({
      tournamentId: 't1',
      champion: { playerId: 'p1', playerName: 'Alice' },
      runnerUp: { playerId: 'p2', playerName: 'Bob' },
      topScorer: { playerId: 'p1', playerName: 'Alice' },
      bestDefense: { playerId: 'p1', playerName: 'Alice' },
      mostWins: { playerId: 'p1', playerName: 'Alice' },
      biggestWin: {
        matchId: 'm1',
        roundNumber: 1,
        winnerPlayerId: 'p1',
        winnerPlayerName: 'Alice',
        loserPlayerId: 'p2',
        loserPlayerName: 'Bob',
        winnerGoals: 4,
        loserGoals: 0,
        goalDifference: 4,
      },
    })
  })

  it('returns null awards when there are no played matches', () => {
    const standings: StandingRow[] = players.map((player) => ({
      playerId: player.id,
      playerName: player.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    }))

    const awards = calculateTournamentAwards({
      tournamentId: tournament.id,
      standings,
      matches: [],
    })

    expect(awards).toEqual({
      tournamentId: 't1',
      champion: null,
      runnerUp: null,
      topScorer: null,
      bestDefense: null,
      biggestWin: null,
      mostWins: null,
    })
  })

  it('returns null for top scorer, most wins and biggest win when all matches are draws', () => {
    const matches = [playedMatch('m1', 'p1', 'p2', 0, 0)]

    const standings = calculateStandings(players.slice(0, 2), matches, tournament)

    const awards = calculateTournamentAwards({
      tournamentId: tournament.id,
      standings,
      matches,
    })

    expect(awards.champion).toEqual({ playerId: 'p1', playerName: 'Alice' })
    expect(awards.runnerUp).toEqual({ playerId: 'p2', playerName: 'Bob' })
    expect(awards.topScorer).toBeNull()
    expect(awards.mostWins).toBeNull()
    expect(awards.biggestWin).toBeNull()
    expect(awards.bestDefense).not.toBeNull()
  })
})
