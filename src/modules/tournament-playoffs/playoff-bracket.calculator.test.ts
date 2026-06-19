import { describe, expect, it } from 'vitest'
import { BracketRound, BracketSourceType } from '@shared/types/bracket-match'
import {
  buildPlayoffBracketPlan,
  getBracketSeedOrder,
  getFirstRoundPairings,
} from './playoff-bracket.calculator'

describe('playoff bracket calculator', () => {
  it('seeds four teams as 1 vs 4 and 2 vs 3', () => {
    expect(getFirstRoundPairings(4)).toEqual([
      { bracketPosition: 1, homeSeed: 1, awaySeed: 4 },
      { bracketPosition: 2, homeSeed: 2, awaySeed: 3 },
    ])
  })

  it('seeds eight teams using standard bracket order', () => {
    expect(getBracketSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6])
    expect(getFirstRoundPairings(8)).toEqual([
      { bracketPosition: 1, homeSeed: 1, awaySeed: 8 },
      { bracketPosition: 2, homeSeed: 4, awaySeed: 5 },
      { bracketPosition: 3, homeSeed: 2, awaySeed: 7 },
      { bracketPosition: 4, homeSeed: 3, awaySeed: 6 },
    ])
  })

  it('builds bracket metadata for all rounds', () => {
    const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']
    const plan = buildPlayoffBracketPlan(playerIds, () => randomUUID())

    expect(plan).toHaveLength(7)

    const quarterfinals = plan.filter((node) => node.bracketRound === BracketRound.QUARTERFINAL)
    const semifinals = plan.filter((node) => node.bracketRound === BracketRound.SEMIFINAL)
    const final = plan.filter((node) => node.bracketRound === BracketRound.FINAL)

    expect(quarterfinals).toHaveLength(4)
    expect(semifinals).toHaveLength(2)
    expect(final).toHaveLength(1)

    expect(quarterfinals[0]).toMatchObject({
      homeSourceType: BracketSourceType.STANDING_POSITION,
      homeSourceRef: '1',
      awaySourceRef: '8',
      homePlayerId: 'p1',
      awayPlayerId: 'p8',
      isFirstRound: true,
    })

    expect(semifinals[0]?.homeSourceType).toBe(BracketSourceType.MATCH_WINNER)
    expect(semifinals[0]?.awaySourceType).toBe(BracketSourceType.MATCH_WINNER)
    expect(final[0]?.nextMatchId).toBeNull()
    expect(quarterfinals[0]?.nextMatchId).toBe(semifinals[0]?.id)
  })
})

function randomUUID(): string {
  return `id-${Math.random()}`
}

describe('playoff bracket calculator ids', () => {
  it('links first-round winners into the next bracket round', () => {
    let counter = 0
    const createId = () => `bm-${++counter}`
    const plan = buildPlayoffBracketPlan(
      ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
      createId,
    )

    const semifinal = plan.find((node) => node.bracketRound === BracketRound.SEMIFINAL)!
    const semifinalFeeders = plan.filter((node) => node.nextMatchId === semifinal.id)

    expect(semifinalFeeders).toHaveLength(2)
    expect(semifinal.homeSourceRef).toBe(semifinalFeeders[0]?.id)
    expect(semifinal.awaySourceRef).toBe(semifinalFeeders[1]?.id)
  })
})
