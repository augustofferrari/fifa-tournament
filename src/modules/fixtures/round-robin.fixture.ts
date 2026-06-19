export interface RoundRobinFixtureMatch {
  roundNumber: number
  homePlayerId: string
  awayPlayerId: string
}

export interface RoundRobinRound {
  roundNumber: number
  matches: Array<Pick<RoundRobinFixtureMatch, 'homePlayerId' | 'awayPlayerId'>>
}

const BYE = '__BYE__'

export class FixtureGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FixtureGenerationError'
  }
}

export function generateRoundRobinFixtures(playerIds: string[]): RoundRobinFixtureMatch[] {
  const uniquePlayerIds = [...new Set(playerIds.map((id) => id.trim()).filter(Boolean))]

  if (uniquePlayerIds.length < 2) {
    throw new FixtureGenerationError('At least 2 players are required to generate fixtures')
  }

  const participants = [...uniquePlayerIds]

  if (participants.length % 2 === 1) {
    participants.push(BYE)
  }

  const participantCount = participants.length
  const roundCount = participantCount - 1
  const slots = [...participants]
  const fixtures: RoundRobinFixtureMatch[] = []

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex++) {
    const roundNumber = roundIndex + 1

    for (let pairingIndex = 0; pairingIndex < participantCount / 2; pairingIndex++) {
      const homePlayerId = slots[pairingIndex]!
      const awayPlayerId = slots[participantCount - 1 - pairingIndex]!

      if (homePlayerId === BYE || awayPlayerId === BYE) {
        continue
      }

      fixtures.push({
        roundNumber,
        homePlayerId,
        awayPlayerId,
      })
    }

    const rotatedParticipant = slots.pop()!
    slots.splice(1, 0, rotatedParticipant)
  }

  return fixtures
}

export function groupRoundRobinFixturesByRound(
  fixtures: RoundRobinFixtureMatch[],
): RoundRobinRound[] {
  const rounds = new Map<number, RoundRobinRound>()

  for (const fixture of fixtures) {
    const existingRound = rounds.get(fixture.roundNumber)

    if (existingRound) {
      existingRound.matches.push({
        homePlayerId: fixture.homePlayerId,
        awayPlayerId: fixture.awayPlayerId,
      })
      continue
    }

    rounds.set(fixture.roundNumber, {
      roundNumber: fixture.roundNumber,
      matches: [
        {
          homePlayerId: fixture.homePlayerId,
          awayPlayerId: fixture.awayPlayerId,
        },
      ],
    })
  }

  return [...rounds.values()].sort((a, b) => a.roundNumber - b.roundNumber)
}
