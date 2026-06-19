import { describe, expect, it } from 'vitest'
import { BracketRound } from '@shared/types/bracket-match'
import {
  applyByeAdvances,
  buildKnockoutOnlyBracketPlan,
  getKnockoutOnlyBracketSize,
} from './knockout-only-bracket.calculator'

describe('knockout-only bracket calculator', () => {
  it('pads player counts up to the next supported bracket size', () => {
    expect(getKnockoutOnlyBracketSize(2)).toBe(2)
    expect(getKnockoutOnlyBracketSize(3)).toBe(4)
    expect(getKnockoutOnlyBracketSize(5)).toBe(8)
    expect(getKnockoutOnlyBracketSize(16)).toBe(16)
  })

  it('creates one first-round match for three players with one bye advance', () => {
    const plan = buildKnockoutOnlyBracketPlan(['p1', 'p2', 'p3'], () => `bm-${Math.random()}`)

    const firstRound = plan.filter((node) => node.isFirstRound)
    expect(firstRound).toHaveLength(2)
    expect(firstRound.filter((node) => node.createsMatch)).toHaveLength(1)
    expect(firstRound.find((node) => node.winnerPlayerId === 'p1')).toMatchObject({
      homePlayerId: 'p1',
      awayPlayerId: null,
      winnerPlayerId: 'p1',
      createsMatch: false,
    })

    const final = plan.find((node) => node.bracketRound === BracketRound.FINAL)
    expect(final?.homePlayerId).toBe('p1')
    expect(final?.awayPlayerId).toBeNull()
  })

  it('creates four first-round matches for eight players without byes', () => {
    const plan = buildKnockoutOnlyBracketPlan([
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
      'p6',
      'p7',
      'p8',
    ])

    const firstRound = plan.filter((node) => node.isFirstRound)
    expect(firstRound).toHaveLength(4)
    expect(firstRound.every((node) => node.createsMatch)).toBe(true)
    expect(plan.filter((node) => node.winnerPlayerId !== null)).toHaveLength(0)
  })

  it('advances byes through later rounds when both sides are not yet known', () => {
    const basePlan = buildKnockoutOnlyBracketPlan(['p1', 'p2', 'p3'], () => `bm-${Math.random()}`)
    const reapplied = applyByeAdvances(basePlan)

    const semifinalWinner = reapplied.find(
      (node) => node.bracketRound === BracketRound.SEMIFINAL && node.winnerPlayerId === 'p1',
    )
    expect(semifinalWinner).toBeDefined()
  })
})
