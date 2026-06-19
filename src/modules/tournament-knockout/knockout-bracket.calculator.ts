import { BracketSourceType } from '@shared/types/bracket-match'
import type { FirstRoundBracketNodeSeed } from '@modules/tournament-playoffs'
import {
  buildBracketPlanFromFirstRound,
  type BracketNodePlan,
} from '@modules/tournament-playoffs'

export interface GroupQualifier {
  groupLetter: string
  playerIds: string[]
}

export interface KnockoutFirstRoundPairing {
  bracketPosition: number
  homeGroupLetter: string
  homePosition: number
  awayGroupLetter: string
  awayPosition: number
  homePlayerId: string
  awayPlayerId: string
}

export function getGroupLetter(groupName: string): string {
  const trimmed = groupName.trim()

  if (trimmed.toUpperCase().startsWith('GROUP ')) {
    return trimmed.slice('GROUP '.length).trim().toUpperCase()
  }

  return trimmed.charAt(0).toUpperCase()
}

export function buildBalancedKnockoutFirstRoundPairings(
  groups: GroupQualifier[],
  qualifiersPerGroup: number,
): KnockoutFirstRoundPairing[] {
  if (groups.length % 2 !== 0) {
    throw new Error('Group count must be even for balanced knockout pairings')
  }

  const pairings: KnockoutFirstRoundPairing[] = []

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 2) {
    const groupA = groups[groupIndex]!
    const groupB = groups[groupIndex + 1]!

    for (let matchIndex = 0; matchIndex < qualifiersPerGroup; matchIndex++) {
      const position = Math.floor(matchIndex / 2) + 1
      const awayPosition = qualifiersPerGroup - position + 1

      if (matchIndex % 2 === 0) {
        pairings.push({
          bracketPosition: pairings.length + 1,
          homeGroupLetter: groupA.groupLetter,
          homePosition: position,
          awayGroupLetter: groupB.groupLetter,
          awayPosition,
          homePlayerId: groupA.playerIds[position - 1]!,
          awayPlayerId: groupB.playerIds[awayPosition - 1]!,
        })
        continue
      }

      pairings.push({
        bracketPosition: pairings.length + 1,
        homeGroupLetter: groupB.groupLetter,
        homePosition: position,
        awayGroupLetter: groupA.groupLetter,
        awayPosition,
        homePlayerId: groupB.playerIds[position - 1]!,
        awayPlayerId: groupA.playerIds[awayPosition - 1]!,
      })
    }
  }

  return pairings
}

function toFirstRoundNodeSeed(pairing: KnockoutFirstRoundPairing): FirstRoundBracketNodeSeed {
  return {
    bracketPosition: pairing.bracketPosition,
    homeSourceType: BracketSourceType.GROUP_POSITION,
    homeSourceRef: `${pairing.homeGroupLetter}:${pairing.homePosition}`,
    awaySourceType: BracketSourceType.GROUP_POSITION,
    awaySourceRef: `${pairing.awayGroupLetter}:${pairing.awayPosition}`,
    homePlayerId: pairing.homePlayerId,
    awayPlayerId: pairing.awayPlayerId,
  }
}

export function buildKnockoutBracketPlan(
  groups: GroupQualifier[],
  qualifiersPerGroup: number,
  createId?: () => string,
): BracketNodePlan[] {
  const firstRoundPairings = buildBalancedKnockoutFirstRoundPairings(groups, qualifiersPerGroup)
  const totalQualified = groups.length * qualifiersPerGroup

  return buildBracketPlanFromFirstRound(
    totalQualified,
    firstRoundPairings.map(toFirstRoundNodeSeed),
    createId,
  )
}
