import { describe, expect, it } from 'vitest'
import { translate } from '@shared/i18n'
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
      locale: 'en',
    })

    expect(narrative).toEqual({
      tournamentId: 't1',
      tournamentName: 'World Cup',
      summary: translate('tournaments.narrative.summaryFinished_other', 'en', {
        name: 'World Cup',
        playerCount: 3,
        matchCount: 3,
        goalPhrase: translate('tournaments.narrative.goal_other', 'en', { count: 8 }),
      }),
      championSummary: translate('tournaments.narrative.championWithRunnerUp', 'en', {
        champion: 'Alice',
        name: 'World Cup',
        points: 4,
        record: translate('tournaments.narrative.recordFormat', 'en', { won: 1, drawn: 1, lost: 0 }),
        goalLine: translate('tournaments.narrative.goalLine', 'en', { for: 5, against: 1 }),
        runnerUp: 'Bob',
      }),
      biggestSurprise: translate('tournaments.narrative.favouritesHeld', 'en', { name: 'World Cup' }),
      topScorerNote: translate('tournaments.narrative.topScorer_other', 'en', {
        player: 'Alice',
        goals: 5,
        matches: 2,
      }),
      defensivePlayerNote: translate('tournaments.narrative.bestDefense_oneGoal_other', 'en', {
        player: 'Alice',
        matches: 2,
      }),
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
      locale: 'en',
    })

    expect(narrative.biggestSurprise).toBe(
      translate('tournaments.narrative.biggestUpset', 'en', {
        winner: 'Charlie',
        loser: 'Alice',
        score: '2-1',
      }),
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
      locale: 'en',
    })

    expect(narrative.summary).toBe(
      translate('tournaments.narrative.readyNoResults_other', 'en', {
        name: 'World Cup',
        count: 3,
      }),
    )
    expect(narrative.championSummary).toBe(
      translate('tournaments.narrative.championNotBegun', 'en'),
    )
    expect(narrative.biggestSurprise).toBe(
      translate('tournaments.narrative.noSurprisesYet', 'en'),
    )
    expect(narrative.topScorerNote).toBe(
      translate('tournaments.narrative.scoringChartEmpty', 'en'),
    )
    expect(narrative.defensivePlayerNote).toBe(
      translate('tournaments.narrative.defensivePending', 'en'),
    )
  })
})
