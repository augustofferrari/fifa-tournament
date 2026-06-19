import { TournamentPhaseType } from '@shared/types/tournament-phase'
import type { Tournament } from '@shared/types/tournament'
import type { TournamentPhase } from '@shared/types/tournament-phase'
import { ValidationError, createValidationError } from './errors'
import { ValidationMessages } from './messages'

export function phaseAllowsDraws(phaseType: TournamentPhaseType): boolean {
  return (
    phaseType === TournamentPhaseType.ROUND_ROBIN ||
    phaseType === TournamentPhaseType.GROUP_STAGE
  )
}

export function validateMatchResultGoals(homeGoals: unknown, awayGoals: unknown) {
  return {
    homeGoals: assertNonNegativeGoal(homeGoals),
    awayGoals: assertNonNegativeGoal(awayGoals),
  }
}

function assertNonNegativeGoal(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw createValidationError(ValidationMessages.goalsCannotBeNegative)
  }

  return value
}

export function validateMatchResultForPhase(
  phaseType: TournamentPhaseType,
  homeGoals: number,
  awayGoals: number,
): void {
  if (!phaseAllowsDraws(phaseType) && homeGoals === awayGoals) {
    throw createValidationError(ValidationMessages.knockoutRequiresWinner)
  }
}

export function validateMatchResult(
  phaseType: TournamentPhaseType,
  homeGoals: unknown,
  awayGoals: unknown,
) {
  const validatedGoals = validateMatchResultGoals(homeGoals, awayGoals)
  validateMatchResultForPhase(phaseType, validatedGoals.homeGoals, validatedGoals.awayGoals)
  return validatedGoals
}

export function assertTournamentAllowsResultEditing(
  tournament: Pick<Tournament, 'status' | 'resultsUnlocked'>,
): void {
  if (tournament.status === 'finished' && !tournament.resultsUnlocked) {
    throw createValidationError(ValidationMessages.finishedTournamentResultsLocked)
  }
}

export function isMatchResultsReadOnly(
  tournament: Pick<Tournament, 'status' | 'resultsUnlocked'>,
  phase: Pick<TournamentPhase, 'status'>,
): boolean {
  if (tournament.status === 'finished') {
    return !tournament.resultsUnlocked
  }

  return phase.status !== 'active'
}
