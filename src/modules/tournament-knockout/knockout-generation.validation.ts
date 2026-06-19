import { ValidationError } from '@shared/validation'
import type { GenerateKnockoutInput } from '@shared/types/tournament-knockout'
import { isSupportedPlayoffQualifiedCount } from '@modules/tournament-playoffs'

export interface ValidatedGenerateKnockoutInput {
  tournamentId: string
  qualifiersPerGroup: number
}

export function validateGenerateKnockoutInput(
  input: GenerateKnockoutInput,
): ValidatedGenerateKnockoutInput {
  const tournamentId =
    typeof input.tournamentId === 'string' && input.tournamentId.trim().length > 0
      ? input.tournamentId.trim()
      : (() => {
          throw new ValidationError('tournamentId is required')
        })()

  if (
    typeof input.qualifiersPerGroup !== 'number' ||
    !Number.isInteger(input.qualifiersPerGroup) ||
    input.qualifiersPerGroup < 1
  ) {
    throw new ValidationError('qualifiersPerGroup must be a positive integer')
  }

  return {
    tournamentId,
    qualifiersPerGroup: input.qualifiersPerGroup,
  }
}

export function validateKnockoutBracketSize(groupCount: number, qualifiersPerGroup: number): void {
  if (groupCount < 2) {
    throw new ValidationError('At least 2 groups are required for knockout generation')
  }

  if (groupCount % 2 !== 0) {
    throw new ValidationError('Group count must be even for balanced knockout pairings')
  }

  const totalQualified = groupCount * qualifiersPerGroup

  if (!isSupportedPlayoffQualifiedCount(totalQualified)) {
    throw new ValidationError(
      'Total qualified players must produce a knockout bracket of 2, 4, 8, or 16 teams',
    )
  }
}
