import { describe, expect, it } from 'vitest'
import { generateRoundRobinFixtures } from './round-robin.fixture'

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

function assertValidRoundRobin(playerIds: string[], fixtures: ReturnType<typeof generateRoundRobinFixtures>) {
  const expectedMatches = (playerIds.length * (playerIds.length - 1)) / 2
  expect(fixtures).toHaveLength(expectedMatches)

  const pairCounts = new Map<string, number>()
  const rounds = new Map<number, Set<string>>()

  for (const fixture of fixtures) {
    expect(fixture.roundNumber).toBeGreaterThan(0)

    const roundPlayers = rounds.get(fixture.roundNumber) ?? new Set<string>()
    expect(roundPlayers.has(fixture.homePlayerId)).toBe(false)
    expect(roundPlayers.has(fixture.awayPlayerId)).toBe(false)
    roundPlayers.add(fixture.homePlayerId)
    roundPlayers.add(fixture.awayPlayerId)
    rounds.set(fixture.roundNumber, roundPlayers)

    const key = pairKey(fixture.homePlayerId, fixture.awayPlayerId)
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
  }

  for (let index = 0; index < playerIds.length; index++) {
    for (let inner = index + 1; inner < playerIds.length; inner++) {
      const key = pairKey(playerIds[index]!, playerIds[inner]!)
      expect(pairCounts.get(key)).toBe(1)
    }
  }

  const expectedRounds = playerIds.length % 2 === 0 ? playerIds.length - 1 : playerIds.length
  expect(rounds.size).toBe(expectedRounds)
}

describe('generateRoundRobinFixtures', () => {
  it('generates valid fixtures for 4 players', () => {
    const playerIds = ['p1', 'p2', 'p3', 'p4']
    const fixtures = generateRoundRobinFixtures(playerIds)

    assertValidRoundRobin(playerIds, fixtures)

    expect(fixtures).toEqual([
      { roundNumber: 1, homePlayerId: 'p1', awayPlayerId: 'p4' },
      { roundNumber: 1, homePlayerId: 'p2', awayPlayerId: 'p3' },
      { roundNumber: 2, homePlayerId: 'p1', awayPlayerId: 'p3' },
      { roundNumber: 2, homePlayerId: 'p4', awayPlayerId: 'p2' },
      { roundNumber: 3, homePlayerId: 'p1', awayPlayerId: 'p2' },
      { roundNumber: 3, homePlayerId: 'p3', awayPlayerId: 'p4' },
    ])
  })

  it('generates valid fixtures for 5 players with internal BYE', () => {
    const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5']
    const fixtures = generateRoundRobinFixtures(playerIds)

    assertValidRoundRobin(playerIds, fixtures)

    const matchesPerRound = new Map<number, number>()
    for (const fixture of fixtures) {
      matchesPerRound.set(fixture.roundNumber, (matchesPerRound.get(fixture.roundNumber) ?? 0) + 1)
    }

    for (const count of matchesPerRound.values()) {
      expect(count).toBe(2)
    }
  })

  it('generates valid fixtures for 6 players', () => {
    const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
    const fixtures = generateRoundRobinFixtures(playerIds)

    assertValidRoundRobin(playerIds, fixtures)

    const matchesPerRound = new Map<number, number>()
    for (const fixture of fixtures) {
      matchesPerRound.set(fixture.roundNumber, (matchesPerRound.get(fixture.roundNumber) ?? 0) + 1)
    }

    expect(matchesPerRound.size).toBe(5)

    for (const count of matchesPerRound.values()) {
      expect(count).toBe(3)
    }
  })

  it('throws when fewer than 2 players are provided', () => {
    expect(() => generateRoundRobinFixtures(['p1'])).toThrow(
      'At least 2 players are required to generate fixtures',
    )
  })
})
