import type { Match, MatchStatus } from '@shared/types/match'

export interface MatchRound {
  roundNumber: number
  matches: Match[]
}

export function groupMatchesByRound(matches: Match[]): MatchRound[] {
  const rounds = new Map<number, Match[]>()

  for (const match of matches) {
    const roundMatches = rounds.get(match.roundNumber) ?? []
    roundMatches.push(match)
    rounds.set(match.roundNumber, roundMatches)
  }

  return [...rounds.entries()]
    .sort(([roundA], [roundB]) => roundA - roundB)
    .map(([roundNumber, roundMatches]) => ({
      roundNumber,
      matches: roundMatches,
    }))
}

export function formatMatchResult(match: Match): string | null {
  if (match.status !== 'played' || match.homeGoals === null || match.awayGoals === null) {
    return null
  }

  return `${match.homeGoals} – ${match.awayGoals}`
}

export function matchStatusLabel(status: MatchStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
