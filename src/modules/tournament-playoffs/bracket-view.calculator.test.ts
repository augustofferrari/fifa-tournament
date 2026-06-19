import { describe, expect, it } from 'vitest'
import { BracketRound, BracketSourceType } from '@shared/types/bracket-match'
import type { BracketMatch } from '@shared/types/bracket-match'
import { getPendingSourceLabel, buildBracketView } from './bracket-view.calculator'

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

describe('bracket view calculator', () => {
  it('labels pending feeder matches as Winner Match N', () => {
    const feederOne = createBracketMatch({
      id: 'qf-1',
      bracketRound: BracketRound.QUARTERFINAL,
      bracketPosition: 1,
    })
    const feederTwo = createBracketMatch({
      id: 'qf-2',
      bracketRound: BracketRound.QUARTERFINAL,
      bracketPosition: 2,
    })
    const bracketMatchesById = new Map([
      [feederOne.id, feederOne],
      [feederTwo.id, feederTwo],
    ])

    expect(
      getPendingSourceLabel(
        BracketSourceType.MATCH_WINNER,
        feederOne.id,
        bracketMatchesById,
      ),
    ).toBe('Winner Match 1')
    expect(
      getPendingSourceLabel(
        BracketSourceType.MATCH_WINNER,
        feederTwo.id,
        bracketMatchesById,
      ),
    ).toBe('Winner Match 2')
  })

  it('builds bracket rounds in display order with scores', () => {
    const semifinal = createBracketMatch({
      id: 'sf-1',
      bracketRound: BracketRound.SEMIFINAL,
      bracketPosition: 1,
      matchId: 'match-1',
      homeSourceType: BracketSourceType.PLAYER,
      homeSourceRef: 'p1',
      awaySourceType: BracketSourceType.PLAYER,
      awaySourceRef: 'p2',
    })
    const finalMatch = createBracketMatch({
      id: 'final-1',
      bracketRound: BracketRound.FINAL,
      bracketPosition: 1,
      homeSourceRef: 'sf-1',
      awaySourceRef: 'sf-2',
    })

    const view = buildBracketView(
      'phase-1',
      [semifinal, finalMatch],
      [
        {
          id: 'match-1',
          tournamentId: 't1',
          phaseId: 'phase-1',
          groupId: null,
          bracketRound: BracketRound.SEMIFINAL,
          bracketPosition: 1,
          roundNumber: 1,
          homePlayerId: 'p1',
          awayPlayerId: 'p2',
          homeGoals: 2,
          awayGoals: 1,
          status: 'played',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      (playerId) => `Player ${playerId}`,
      true,
    )

    expect(view.rounds.map((round) => round.round)).toEqual([
      BracketRound.SEMIFINAL,
      BracketRound.FINAL,
    ])
    expect(view.rounds[0]?.matches[0]?.home).toMatchObject({
      label: 'Player p1',
      score: 2,
      isPending: false,
    })
    expect(view.rounds[1]?.matches[0]?.home).toMatchObject({
      label: 'Winner Match 1',
      isPending: true,
    })
    expect(view.rounds[0]?.matches[0]?.canEnterResult).toBe(true)
  })

  it('allows editing played matches when result entry is enabled', () => {
    const semifinal = createBracketMatch({
      id: 'sf-1',
      bracketRound: BracketRound.SEMIFINAL,
      bracketPosition: 1,
      matchId: 'match-1',
      homeSourceType: BracketSourceType.PLAYER,
      homeSourceRef: 'p1',
      awaySourceType: BracketSourceType.PLAYER,
      awaySourceRef: 'p2',
    })

    const view = buildBracketView(
      'phase-1',
      [semifinal],
      [
        {
          id: 'match-1',
          tournamentId: 't1',
          phaseId: 'phase-1',
          groupId: null,
          bracketRound: BracketRound.SEMIFINAL,
          bracketPosition: 1,
          roundNumber: 1,
          homePlayerId: 'p1',
          awayPlayerId: 'p2',
          homeGoals: 2,
          awayGoals: 1,
          status: 'played',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      (playerId) => `Player ${playerId}`,
      true,
    )

    expect(view.rounds[0]?.matches[0]?.canEnterResult).toBe(true)
  })
})
