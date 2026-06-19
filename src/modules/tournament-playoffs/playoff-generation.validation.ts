import { ValidationError } from '@shared/validation'
import type { GeneratePlayoffsInput } from '@shared/types/tournament-playoff'
import {
  isSupportedPlayoffQualifiedCount,
  SUPPORTED_PLAYOFF_QUALIFIED_COUNTS,
} from './playoff-bracket.calculator'

export interface ValidatedGeneratePlayoffsInput {
  tournamentId: string
  qualifiedCount: number
}

export function validateGeneratePlayoffsInput(
  input: GeneratePlayoffsInput,
): ValidatedGeneratePlayoffsInput {
  const tournamentId =
    typeof input.tournamentId === 'string' && input.tournamentId.trim().length > 0
      ? input.tournamentId.trim()
      : (() => {
          throw new ValidationError('tournamentId is required')
        })()

  if (typeof input.qualifiedCount !== 'number' || !Number.isInteger(input.qualifiedCount)) {
    throw new ValidationError('qualifiedCount must be an integer')
  }

  if (!isSupportedPlayoffQualifiedCount(input.qualifiedCount)) {
    throw new ValidationError(
      `qualifiedCount must be one of ${SUPPORTED_PLAYOFF_QUALIFIED_COUNTS.join(', ')}`,
    )
  }

  return {
    tournamentId,
    qualifiedCount: input.qualifiedCount,
  }
}
