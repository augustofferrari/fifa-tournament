import type { Match } from '@shared/types/match'
import type { TournamentPhase } from '@shared/types/tournament-phase'

export function getPhaseMatches(phaseId: string, matches: Match[]): Match[] {
  return matches.filter((match) => match.phaseId === phaseId)
}

export function areAllPhaseMatchesPlayed(phaseId: string, matches: Match[]): boolean {
  const phaseMatches = getPhaseMatches(phaseId, matches)

  if (phaseMatches.length === 0) {
    return false
  }

  return phaseMatches.every(
    (match) => match.status === 'played' && match.homeGoals !== null && match.awayGoals !== null,
  )
}

export function getNextPhase(
  phases: TournamentPhase[],
  currentPhase: TournamentPhase,
): TournamentPhase | null {
  return (
    phases
      .filter((phase) => phase.orderIndex > currentPhase.orderIndex)
      .sort((left, right) => left.orderIndex - right.orderIndex)[0] ?? null
  )
}

export function hasNextPhase(phases: TournamentPhase[], currentPhase: TournamentPhase): boolean {
  return getNextPhase(phases, currentPhase) !== null
}
