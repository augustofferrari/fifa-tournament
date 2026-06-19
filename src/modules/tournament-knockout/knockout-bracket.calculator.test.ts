import { describe, expect, it } from 'vitest'
import { BracketSourceType } from '@shared/types/bracket-match'
import {
  buildBalancedKnockoutFirstRoundPairings,
  buildKnockoutBracketPlan,
  getGroupLetter,
} from './knockout-bracket.calculator'

describe('knockout bracket calculator', () => {
  it('extracts group letters from group names', () => {
    expect(getGroupLetter('Group A')).toBe('A')
    expect(getGroupLetter('Group D')).toBe('D')
  })

  it('pairs two groups with top 2 qualifiers as A1 vs B2 and B1 vs A2', () => {
    const pairings = buildBalancedKnockoutFirstRoundPairings(
      [
        { groupLetter: 'A', playerIds: ['a1', 'a2'] },
        { groupLetter: 'B', playerIds: ['b1', 'b2'] },
      ],
      2,
    )

    expect(pairings).toEqual([
      {
        bracketPosition: 1,
        homeGroupLetter: 'A',
        homePosition: 1,
        awayGroupLetter: 'B',
        awayPosition: 2,
        homePlayerId: 'a1',
        awayPlayerId: 'b2',
      },
      {
        bracketPosition: 2,
        homeGroupLetter: 'B',
        homePosition: 1,
        awayGroupLetter: 'A',
        awayPosition: 2,
        homePlayerId: 'b1',
        awayPlayerId: 'a2',
      },
    ])
  })

  it('pairs four groups with top 2 qualifiers using cross-group balance', () => {
    const pairings = buildBalancedKnockoutFirstRoundPairings(
      [
        { groupLetter: 'A', playerIds: ['a1', 'a2'] },
        { groupLetter: 'B', playerIds: ['b1', 'b2'] },
        { groupLetter: 'C', playerIds: ['c1', 'c2'] },
        { groupLetter: 'D', playerIds: ['d1', 'd2'] },
      ],
      2,
    )

    expect(
      pairings.map((pairing) => ({
        home: `${pairing.homeGroupLetter}${pairing.homePosition}`,
        away: `${pairing.awayGroupLetter}${pairing.awayPosition}`,
      })),
    ).toEqual([
      { home: 'A1', away: 'B2' },
      { home: 'B1', away: 'A2' },
      { home: 'C1', away: 'D2' },
      { home: 'D1', away: 'C2' },
    ])
  })

  it('builds knockout bracket metadata with GROUP_POSITION sources', () => {
    const plan = buildKnockoutBracketPlan(
      [
        { groupLetter: 'A', playerIds: ['a1', 'a2'] },
        { groupLetter: 'B', playerIds: ['b1', 'b2'] },
      ],
      2,
      () => `bm-${Math.random()}`,
    )

    const firstRound = plan.filter((node) => node.isFirstRound)

    expect(firstRound).toHaveLength(2)
    expect(firstRound[0]).toMatchObject({
      homeSourceType: BracketSourceType.GROUP_POSITION,
      homeSourceRef: 'A:1',
      awaySourceRef: 'B:2',
    })
    expect(plan).toHaveLength(3)
  })
})
