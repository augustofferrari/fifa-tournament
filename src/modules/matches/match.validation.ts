import { ValidationError, ValidationMessages } from '@shared/validation'

export { ValidationError }

export function validateMatchResultGoals(homeGoals: unknown, awayGoals: unknown) {
  return {
    homeGoals: assertNonNegativeGoal(homeGoals),
    awayGoals: assertNonNegativeGoal(awayGoals),
  }
}

function assertNonNegativeGoal(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ValidationError(ValidationMessages.goalsCannotBeNegative)
  }

  return value
}
