import { describe, expect, it } from 'vitest'
import { generateRoundRobinFixtures } from '@modules/fixtures'
import { generateGroupStageRoundRobinFixtures } from './group-stage.fixture'

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

describe('generateGroupStageRoundRobinFixtures', () => {
  it('generates independent round robin fixtures for each group', () => {
    const groupAPlayers = ['a1', 'a2', 'a3', 'a4']
    const groupBPlayers = ['b1', 'b2', 'b3']

    const assignments = generateGroupStageRoundRobinFixtures([
      { groupId: 'group-a', playerIds: groupAPlayers },
      { groupId: 'group-b', playerIds: groupBPlayers },
    ])

    expect(assignments).toHaveLength(2)
    expect(assignments[0]).toEqual({
      groupId: 'group-a',
      fixtures: generateRoundRobinFixtures(groupAPlayers),
    })
    expect(assignments[1]).toEqual({
      groupId: 'group-b',
      fixtures: generateRoundRobinFixtures(groupBPlayers),
    })
  })

  it('does not create cross-group pairings', () => {
    const assignments = generateGroupStageRoundRobinFixtures([
      { groupId: 'group-a', playerIds: ['a1', 'a2', 'a3'] },
      { groupId: 'group-b', playerIds: ['b1', 'b2', 'b3'] },
    ])

    for (const assignment of assignments) {
      const prefix = assignment.groupId === 'group-a' ? 'a' : 'b'

      for (const fixture of assignment.fixtures) {
        expect(fixture.homePlayerId.startsWith(prefix)).toBe(true)
        expect(fixture.awayPlayerId.startsWith(prefix)).toBe(true)
      }
    }

    const allFixtures = assignments.flatMap((assignment) => assignment.fixtures)
    const pairCounts = new Map<string, number>()

    for (const fixture of allFixtures) {
      const key = pairKey(fixture.homePlayerId, fixture.awayPlayerId)
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
    }

    expect(pairCounts.get(pairKey('a1', 'a2'))).toBe(1)
    expect(pairCounts.get(pairKey('b1', 'b2'))).toBe(1)
    expect(pairCounts.has(pairKey('a1', 'b1'))).toBe(false)
  })
})
