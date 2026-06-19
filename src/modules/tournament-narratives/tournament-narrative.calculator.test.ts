import { describe, expect, it } from 'vitest'
import type { Match } from '@shared/types/match'
import { EMPTY_MATCH_PHASE_FIELDS } from '@shared/types/match'
import type { StandingRow } from '@shared/types/standings'
import { calculateStandings } from '@modules/tournaments/standings.calculator'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import { DEFAULT_TOURNAMENT_FORMAT_CONFIG } from '@shared/types/tournament-format'
import { calculateTournamentAwards } from '@modules/tournament-awards/tournament-awards.calculator'
import { generateTournamentNarrative } from './tournament-narrative.calculator'

const tournament: Tournament = {
  id: 't1',
  name: 'World Cup',
  status: 'finished',
  ...DEFAULT_TOURNAMENT_FORMAT_CONFIG,
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  resultsUnlocked: false,
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

describe('generateTournamentNarrative', () => {
  it('builds narrative sections from standings, awards and match stats', () => {
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

    const narrative = generateTournamentNarrative({
      tournament,
      standings,
      awards,
      matches,
    })

    expect(narrative).toEqual({
      tournamentId: 't1',
      tournamentName: 'World Cup',
      summary:
        'World Cup wrapped up with 3 players, 3 matches played and 8 goals scored.',
      championSummary:
        'Alice lifted World Cup, finishing on 4 points (1W-1D-0L, 5 scored and 1 conceded) and holding off Bob for the crown.',
      biggestSurprise:
        'The favourites largely held firm in World Cup — no single result flipped the expected order.',
      topScorerNote: 'Alice topped the scoring charts with 5 goals across 2 matches.',
      defensivePlayerNote:
        'Alice led the defensive standings, conceding just 1 goal in 2 matches.',
    })
  })

  it('highlights an upset when a lower-ranked player beats a higher-ranked rival', () => {
    const matches = [
      playedMatch('m1', 'p3', 'p1', 2, 1, 1),
      playedMatch('m2', 'p1', 'p2', 3, 0, 2),
      playedMatch('m3', 'p2', 'p3', 2, 0, 3),
    ]

    const standings = calculateStandings(players, matches, tournament)
    const awards = calculateTournamentAwards({
      tournamentId: tournament.id,
      standings,
      matches,
    })

    const narrative = generateTournamentNarrative({
      tournament,
      standings,
      awards,
      matches,
    })

    expect(narrative.biggestSurprise).toBe(
      'Charlie delivered the biggest shock, beating higher-ranked Alice 2-1 against the standings grain.',
    )
  })

  it('returns placeholder narrative when no matches have been played', () => {
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

    const narrative = generateTournamentNarrative({
      tournament: { ...tournament, status: 'draft' },
      standings,
      awards,
      matches: [],
    })

    expect(narrative.summary).toBe(
      'World Cup is ready to go with 3 players, waiting for the first results.',
    )
    expect(narrative.championSummary).toBe(
      'The title race has not begun — no champion can be crowned yet.',
    )
    expect(narrative.biggestSurprise).toBe(
      'No surprises yet — the tournament is still waiting for its first result.',
    )
    expect(narrative.topScorerNote).toBe(
      'The scoring chart is empty until the first goals go in.',
    )
    expect(narrative.defensivePlayerNote).toBe(
      'Defensive honours will be decided once the action starts.',
    )
  })
})
