import { describe, expect, it } from 'vitest'
import {
  buildSnakeGroupAssignments,
  distributePlayersSnake,
  getGroupName,
} from './group-generation.calculator'

describe('group generation calculator', () => {
  it('names groups sequentially from Group A', () => {
    expect(getGroupName(1)).toBe('Group A')
    expect(getGroupName(2)).toBe('Group B')
    expect(getGroupName(4)).toBe('Group D')
  })

  it('distributes eight players across two groups using snake order', () => {
    const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']

    expect(distributePlayersSnake(playerIds, 2)).toEqual([
      ['p1', 'p4', 'p5', 'p8'],
      ['p2', 'p3', 'p6', 'p7'],
    ])
  })

  it('builds ordered group assignments with one-based indexes', () => {
    const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']

    expect(buildSnakeGroupAssignments(playerIds, 2)).toEqual([
      { orderIndex: 1, playerIds: ['p1', 'p4', 'p5', 'p8'] },
      { orderIndex: 2, playerIds: ['p2', 'p3', 'p6', 'p7'] },
    ])
  })
})
