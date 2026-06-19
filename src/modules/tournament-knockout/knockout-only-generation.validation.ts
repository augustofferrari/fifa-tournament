import { ValidationError } from '@shared/validation'
import {
  getKnockoutOnlyBracketSize,
  MAX_KNOCKOUT_ONLY_PLAYERS,
  MIN_KNOCKOUT_ONLY_PLAYERS,
} from './knockout-only-bracket.calculator'
import type { GenerateKnockoutOnlyInput } from '@shared/types/tournament-knockout'

export interface ValidatedGenerateKnockoutOnlyInput {
  tournamentId: string
  playerIds: string[]
}

export function validateGenerateKnockoutOnlyInput(
  input: GenerateKnockoutOnlyInput,
): ValidatedGenerateKnockoutOnlyInput {
  const tournamentId =
    typeof input.tournamentId === 'string' && input.tournamentId.trim().length > 0
      ? input.tournamentId.trim()
      : (() => {
          throw new ValidationError('tournamentId is required')
        })()

  if (!Array.isArray(input.playerIds) || input.playerIds.length === 0) {
    throw new ValidationError('playerIds must be a non-empty array')
  }

  const playerIds: string[] = []

  for (const [index, playerId] of input.playerIds.entries()) {
    if (typeof playerId !== 'string' || playerId.trim().length === 0) {
      throw new ValidationError(`playerIds[${index}] is required`)
    }

    playerIds.push(playerId.trim())
  }

  const uniquePlayerIds = [...new Set(playerIds)]

  if (uniquePlayerIds.length !== playerIds.length) {
    throw new ValidationError('A player cannot appear more than once in the bracket')
  }

  if (playerIds.length < MIN_KNOCKOUT_ONLY_PLAYERS) {
    throw new ValidationError(`At least ${MIN_KNOCKOUT_ONLY_PLAYERS} players are required`)
  }

  if (playerIds.length > MAX_KNOCKOUT_ONLY_PLAYERS) {
    throw new ValidationError(`At most ${MAX_KNOCKOUT_ONLY_PLAYERS} players are supported`)
  }

  getKnockoutOnlyBracketSize(playerIds.length)

  return {
    tournamentId,
    playerIds,
  }
}
