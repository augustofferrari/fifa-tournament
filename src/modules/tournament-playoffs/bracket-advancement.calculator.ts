import { BracketRound, BracketSourceType } from '@shared/types/bracket-match'
import type { BracketMatch } from '@shared/types/bracket-match'
import type { Match } from '@shared/types/match'

export function determineMatchWinnerPlayerId(
  match: Pick<Match, 'homePlayerId' | 'awayPlayerId'>,
  homeGoals: number,
  awayGoals: number,
): string {
  if (homeGoals === awayGoals) {
    throw new Error('Knockout matches require a winner')
  }

  return homeGoals > awayGoals ? match.homePlayerId : match.awayPlayerId
}

export function resolveBracketSourcePlayerId(
  sourceType: BracketSourceType,
  sourceRef: string | null,
  bracketMatchesById: Map<string, BracketMatch>,
): string | null {
  if (!sourceRef) {
    return null
  }

  switch (sourceType) {
    case BracketSourceType.MATCH_WINNER: {
      return bracketMatchesById.get(sourceRef)?.winnerPlayerId ?? null
    }
    case BracketSourceType.PLAYER:
      return sourceRef
    case BracketSourceType.STANDING_POSITION:
    case BracketSourceType.GROUP_POSITION:
      return null
  }
}

export function resolveBracketMatchParticipants(
  bracketMatch: BracketMatch,
  bracketMatchesById: Map<string, BracketMatch>,
): { homePlayerId: string | null; awayPlayerId: string | null } {
  return {
    homePlayerId: resolveBracketSourcePlayerId(
      bracketMatch.homeSourceType,
      bracketMatch.homeSourceRef,
      bracketMatchesById,
    ),
    awayPlayerId: resolveBracketSourcePlayerId(
      bracketMatch.awaySourceType,
      bracketMatch.awaySourceRef,
      bracketMatchesById,
    ),
  }
}

export function getRoundNumberForBracketRound(bracketRound: BracketRound): number {
  switch (bracketRound) {
    case BracketRound.ROUND_OF_16:
      return 1
    case BracketRound.QUARTERFINAL:
      return 2
    case BracketRound.SEMIFINAL:
      return 3
    case BracketRound.FINAL:
      return 4
  }
}

export function isReadyForScheduledMatch(
  bracketMatch: BracketMatch,
  bracketMatchesById: Map<string, BracketMatch>,
): boolean {
  if (bracketMatch.matchId) {
    return false
  }

  const { homePlayerId, awayPlayerId } = resolveBracketMatchParticipants(
    bracketMatch,
    bracketMatchesById,
  )

  return homePlayerId !== null && awayPlayerId !== null
}
