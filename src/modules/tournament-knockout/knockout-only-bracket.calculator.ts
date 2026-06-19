import { BracketSourceType } from '@shared/types/bracket-match'
import {
  buildBracketPlanFromFirstRound,
  getFirstRoundPairings,
  type BracketNodePlan,
  type PlayoffQualifiedCount,
} from '@modules/tournament-playoffs'

export const MIN_KNOCKOUT_ONLY_PLAYERS = 2
export const MAX_KNOCKOUT_ONLY_PLAYERS = 16

export interface KnockoutOnlyBracketNodePlan extends BracketNodePlan {
  winnerPlayerId: string | null
  createsMatch: boolean
}

const ROUND_PROCESSING_ORDER = [
  'ROUND_OF_16',
  'QUARTERFINAL',
  'SEMIFINAL',
  'FINAL',
] as const

export function getKnockoutOnlyBracketSize(playerCount: number): PlayoffQualifiedCount {
  if (playerCount < MIN_KNOCKOUT_ONLY_PLAYERS) {
    throw new Error(`At least ${MIN_KNOCKOUT_ONLY_PLAYERS} players are required`)
  }

  if (playerCount <= 2) {
    return 2
  }

  if (playerCount <= 4) {
    return 4
  }

  if (playerCount <= 8) {
    return 8
  }

  if (playerCount <= MAX_KNOCKOUT_ONLY_PLAYERS) {
    return 16
  }

  throw new Error(`At most ${MAX_KNOCKOUT_ONLY_PLAYERS} players are supported`)
}

export function buildKnockoutOnlyBracketPlan(
  playerIds: string[],
  createId?: () => string,
): KnockoutOnlyBracketNodePlan[] {
  const bracketSize = getKnockoutOnlyBracketSize(playerIds.length)
  const participants: Array<string | null> = [...playerIds]

  while (participants.length < bracketSize) {
    participants.push(null)
  }

  const pairings = getFirstRoundPairings(bracketSize)
  const basePlan = buildBracketPlanFromFirstRound(
    bracketSize,
    pairings.map((pairing) => ({
      bracketPosition: pairing.bracketPosition,
      homeSourceType: BracketSourceType.PLAYER,
      homeSourceRef: participants[pairing.homeSeed - 1] ?? null,
      awaySourceType: BracketSourceType.PLAYER,
      awaySourceRef: participants[pairing.awaySeed - 1] ?? null,
      homePlayerId: participants[pairing.homeSeed - 1] ?? null,
      awayPlayerId: participants[pairing.awaySeed - 1] ?? null,
    })),
    createId,
  )

  return applyByeAdvances(basePlan)
}

export function applyByeAdvances(plan: BracketNodePlan[]): KnockoutOnlyBracketNodePlan[] {
  const nodes = plan.map((node) => ({
    ...node,
    winnerPlayerId: null as string | null,
    createsMatch: false,
  }))
  const winnerByNodeId = new Map<string, string>()
  const sortedNodes = [...nodes].sort(compareBracketNodesByRound)

  for (const node of sortedNodes) {
    if (!node.isFirstRound) {
      if (node.homeSourceRef) {
        const feederWinner = winnerByNodeId.get(node.homeSourceRef)
        if (feederWinner) {
          node.homePlayerId = feederWinner
        }
      }

      if (node.awaySourceRef) {
        const feederWinner = winnerByNodeId.get(node.awaySourceRef)
        if (feederWinner) {
          node.awayPlayerId = feederWinner
        }
      }
    }

    const { homePlayerId, awayPlayerId } = node

    if (homePlayerId && awayPlayerId) {
      if (node.isFirstRound) {
        node.createsMatch = true
      }
      continue
    }

    if (homePlayerId && !awayPlayerId) {
      node.winnerPlayerId = homePlayerId
      winnerByNodeId.set(node.id, homePlayerId)
      continue
    }

    if (!homePlayerId && awayPlayerId) {
      node.winnerPlayerId = awayPlayerId
      winnerByNodeId.set(node.id, awayPlayerId)
    }
  }

  return nodes
}

function compareBracketNodesByRound(
  left: KnockoutOnlyBracketNodePlan,
  right: KnockoutOnlyBracketNodePlan,
): number {
  const leftIndex = ROUND_PROCESSING_ORDER.indexOf(left.bracketRound)
  const rightIndex = ROUND_PROCESSING_ORDER.indexOf(right.bracketRound)

  if (leftIndex !== rightIndex) {
    return leftIndex - rightIndex
  }

  return left.bracketPosition - right.bracketPosition
}

export function getAdvancedByePlayerIds(plan: KnockoutOnlyBracketNodePlan[]): string[] {
  return [
    ...new Set(
      plan.filter((node) => node.winnerPlayerId !== null).map((node) => node.winnerPlayerId!),
    ),
  ]
}
