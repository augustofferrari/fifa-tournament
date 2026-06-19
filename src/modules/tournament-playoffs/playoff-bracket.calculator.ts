import { randomUUID } from 'node:crypto'
import {
  BracketNextMatchSlot,
  BracketRound,
  BracketSourceType,
} from '@shared/types/bracket-match'

export const SUPPORTED_PLAYOFF_QUALIFIED_COUNTS = [2, 4, 8, 16] as const

export type PlayoffQualifiedCount = (typeof SUPPORTED_PLAYOFF_QUALIFIED_COUNTS)[number]

export interface FirstRoundBracketPairing {
  bracketPosition: number
  homeSeed: number
  awaySeed: number
}

export interface BracketNodePlan {
  id: string
  bracketRound: BracketRound
  bracketPosition: number
  homeSourceType: BracketSourceType
  homeSourceRef: string | null
  awaySourceType: BracketSourceType
  awaySourceRef: string | null
  homePlayerId: string | null
  awayPlayerId: string | null
  nextMatchId: string | null
  nextMatchSlot: BracketNextMatchSlot | null
  isFirstRound: boolean
}

export function isSupportedPlayoffQualifiedCount(
  value: number,
): value is PlayoffQualifiedCount {
  return SUPPORTED_PLAYOFF_QUALIFIED_COUNTS.includes(value as PlayoffQualifiedCount)
}

export function getBracketSeedOrder(qualifiedCount: PlayoffQualifiedCount): number[] {
  if (qualifiedCount === 2) {
    return [1, 2]
  }

  let seeds = [1, 2]

  while (seeds.length < qualifiedCount) {
    const nextRoundSize = seeds.length * 2
    const sum = nextRoundSize + 1
    seeds = seeds.flatMap((seed) => [seed, sum - seed])
  }

  return seeds
}

export function getFirstRoundPairings(
  qualifiedCount: PlayoffQualifiedCount,
): FirstRoundBracketPairing[] {
  const seedOrder = getBracketSeedOrder(qualifiedCount)
  const pairings: FirstRoundBracketPairing[] = []

  for (let index = 0; index < seedOrder.length; index += 2) {
    pairings.push({
      bracketPosition: pairings.length + 1,
      homeSeed: seedOrder[index]!,
      awaySeed: seedOrder[index + 1]!,
    })
  }

  return pairings
}

export function getBracketRoundForTeamCount(teams: number): BracketRound {
  switch (teams) {
    case 2:
      return BracketRound.FINAL
    case 4:
      return BracketRound.SEMIFINAL
    case 8:
      return BracketRound.QUARTERFINAL
    case 16:
      return BracketRound.ROUND_OF_16
    default:
      throw new Error(`Unsupported bracket team count: ${teams}`)
  }
}

export function getBracketRoundLayers(qualifiedCount: PlayoffQualifiedCount): BracketRound[] {
  const layers: BracketRound[] = []
  let teams = qualifiedCount

  while (teams >= 2) {
    layers.push(getBracketRoundForTeamCount(teams))
    teams /= 2
  }

  return layers
}

function createNodeId(round: BracketRound, position: number): string {
  return `${round}:${position}`
}

export interface FirstRoundBracketNodeSeed {
  bracketPosition: number
  homeSourceType: BracketSourceType
  homeSourceRef: string | null
  awaySourceType: BracketSourceType
  awaySourceRef: string | null
  homePlayerId: string | null
  awayPlayerId: string | null
}

export function getBracketRoundInsertionOrder(round: BracketRound): number {
  switch (round) {
    case BracketRound.FINAL:
      return 1
    case BracketRound.SEMIFINAL:
      return 2
    case BracketRound.QUARTERFINAL:
      return 3
    case BracketRound.ROUND_OF_16:
      return 4
  }
}

export function buildBracketPlanFromFirstRound(
  qualifiedCount: number,
  firstRoundNodes: FirstRoundBracketNodeSeed[],
  createId: () => string = randomUUID,
): BracketNodePlan[] {
  if (!isSupportedPlayoffQualifiedCount(qualifiedCount)) {
    throw new Error(`qualifiedCount must be one of ${SUPPORTED_PLAYOFF_QUALIFIED_COUNTS.join(', ')}`)
  }

  if (firstRoundNodes.length !== qualifiedCount / 2) {
    throw new Error('First round node count does not match qualified team count')
  }

  const roundLayers = getBracketRoundLayers(qualifiedCount)
  const nodesByKey = new Map<string, BracketNodePlan>()
  const firstRound = roundLayers[0]!

  for (const node of firstRoundNodes) {
    const key = createNodeId(firstRound, node.bracketPosition)
    nodesByKey.set(key, {
      id: createId(),
      bracketRound: firstRound,
      bracketPosition: node.bracketPosition,
      homeSourceType: node.homeSourceType,
      homeSourceRef: node.homeSourceRef,
      awaySourceType: node.awaySourceType,
      awaySourceRef: node.awaySourceRef,
      homePlayerId: node.homePlayerId,
      awayPlayerId: node.awayPlayerId,
      nextMatchId: null,
      nextMatchSlot: null,
      isFirstRound: true,
    })
  }

  for (let layerIndex = 1; layerIndex < roundLayers.length; layerIndex++) {
    const round = roundLayers[layerIndex]!
    const previousRound = roundLayers[layerIndex - 1]!
    const matchCount = 2 ** (roundLayers.length - layerIndex - 1)

    for (let position = 1; position <= matchCount; position++) {
      const key = createNodeId(round, position)
      nodesByKey.set(key, {
        id: createId(),
        bracketRound: round,
        bracketPosition: position,
        homeSourceType: BracketSourceType.MATCH_WINNER,
        homeSourceRef: null,
        awaySourceType: BracketSourceType.MATCH_WINNER,
        awaySourceRef: null,
        homePlayerId: null,
        awayPlayerId: null,
        nextMatchId: null,
        nextMatchSlot: null,
        isFirstRound: false,
      })
    }

    const previousMatchCount = 2 ** (roundLayers.length - layerIndex)
    for (let previousPosition = 1; previousPosition <= previousMatchCount; previousPosition++) {
      const feeder = nodesByKey.get(createNodeId(previousRound, previousPosition))
      const nextPosition = Math.ceil(previousPosition / 2)
      const nextNode = nodesByKey.get(createNodeId(round, nextPosition))

      if (!feeder || !nextNode) {
        continue
      }

      feeder.nextMatchId = nextNode.id
      feeder.nextMatchSlot =
        previousPosition % 2 === 1 ? BracketNextMatchSlot.HOME : BracketNextMatchSlot.AWAY
    }
  }

  for (let layerIndex = 1; layerIndex < roundLayers.length; layerIndex++) {
    const round = roundLayers[layerIndex]!
    const previousRound = roundLayers[layerIndex - 1]!
    const matchCount = 2 ** (roundLayers.length - layerIndex - 1)

    for (let position = 1; position <= matchCount; position++) {
      const node = nodesByKey.get(createNodeId(round, position))!
      const homeFeeder = nodesByKey.get(
        createNodeId(previousRound, position * 2 - 1),
      )
      const awayFeeder = nodesByKey.get(createNodeId(previousRound, position * 2))

      node.homeSourceRef = homeFeeder?.id ?? null
      node.awaySourceRef = awayFeeder?.id ?? null
    }
  }

  return roundLayers.flatMap((round) => {
    const matchCount = 2 ** (roundLayers.length - roundLayers.indexOf(round) - 1)
    return Array.from({ length: matchCount }, (_, index) =>
      nodesByKey.get(createNodeId(round, index + 1)),
    ).filter((node): node is BracketNodePlan => node !== undefined)
  })
}

export function buildPlayoffBracketPlan(
  qualifiedPlayerIds: string[],
  createId: () => string = randomUUID,
): BracketNodePlan[] {
  const qualifiedCount = qualifiedPlayerIds.length

  if (!isSupportedPlayoffQualifiedCount(qualifiedCount)) {
    throw new Error(`qualifiedCount must be one of ${SUPPORTED_PLAYOFF_QUALIFIED_COUNTS.join(', ')}`)
  }

  const firstRoundPairings = getFirstRoundPairings(qualifiedCount)

  return buildBracketPlanFromFirstRound(
    qualifiedCount,
    firstRoundPairings.map((pairing) => ({
      bracketPosition: pairing.bracketPosition,
      homeSourceType: BracketSourceType.STANDING_POSITION,
      homeSourceRef: String(pairing.homeSeed),
      awaySourceType: BracketSourceType.STANDING_POSITION,
      awaySourceRef: String(pairing.awaySeed),
      homePlayerId: qualifiedPlayerIds[pairing.homeSeed - 1] ?? null,
      awayPlayerId: qualifiedPlayerIds[pairing.awaySeed - 1] ?? null,
    })),
    createId,
  )
}
