import type { TFunction } from 'i18next'
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

export function matchStatusLabel(status: MatchStatus | 'pending', t: TFunction): string {
  switch (status) {
    case 'scheduled':
      return t('common.status.scheduled')
    case 'played':
      return t('common.status.played')
    case 'pending':
      return t('common.status.pending')
    case 'cancelled':
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}
