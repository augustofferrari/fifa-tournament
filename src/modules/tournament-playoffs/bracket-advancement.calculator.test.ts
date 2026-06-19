import { describe, expect, it } from 'vitest'
import { BracketRound, BracketSourceType } from '@shared/types/bracket-match'
import type { BracketMatch } from '@shared/types/bracket-match'
import {
  determineMatchWinnerPlayerId,
  isReadyForScheduledMatch,
  resolveBracketMatchParticipants,
} from './bracket-advancement.calculator'

function createBracketMatch(overrides: Partial<BracketMatch>): BracketMatch {
  return {
    id: overrides.id ?? 'bm-1',
    tournamentId: overrides.tournamentId ?? 't1',
    phaseId: overrides.phaseId ?? 'phase-1',
    matchId: overrides.matchId ?? null,
    bracketRound: overrides.bracketRound ?? BracketRound.FINAL,
    bracketPosition: overrides.bracketPosition ?? 1,
    homeSourceType: overrides.homeSourceType ?? BracketSourceType.MATCH_WINNER,
    homeSourceRef: overrides.homeSourceRef ?? null,
    awaySourceType: overrides.awaySourceType ?? BracketSourceType.MATCH_WINNER,
    awaySourceRef: overrides.awaySourceRef ?? null,
    winnerPlayerId: overrides.winnerPlayerId ?? null,
    nextMatchId: overrides.nextMatchId ?? null,
    nextMatchSlot: overrides.nextMatchSlot ?? null,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
  }
}

describe('bracket advancement calculator', () => {
  it('determines the winner from match goals', () => {
    expect(
      determineMatchWinnerPlayerId(
        { homePlayerId: 'home', awayPlayerId: 'away' },
        2,
        1,
      ),
    ).toBe('home')
  })

  it('resolves next-round participants from feeder winners', () => {
    const semifinalOne = createBracketMatch({
      id: 'sf-1',
      winnerPlayerId: 'p1',
    })
    const semifinalTwo = createBracketMatch({
      id: 'sf-2',
      winnerPlayerId: 'p2',
    })
    const finalMatch = createBracketMatch({
      id: 'final',
      homeSourceRef: 'sf-1',
      awaySourceRef: 'sf-2',
    })
    const bracketMatchesById = new Map([
      [semifinalOne.id, semifinalOne],
      [semifinalTwo.id, semifinalTwo],
      [finalMatch.id, finalMatch],
    ])

    expect(resolveBracketMatchParticipants(finalMatch, bracketMatchesById)).toEqual({
      homePlayerId: 'p1',
      awayPlayerId: 'p2',
    })
    expect(isReadyForScheduledMatch(finalMatch, bracketMatchesById)).toBe(true)
  })
})
