import type { BracketMatch } from './bracket-match'
import type { Match } from './match'

export interface GenerateKnockoutInput {
  tournamentId: string
  qualifiersPerGroup: number
}

export interface GenerateKnockoutResult {
  knockoutPhaseId: string
  bracketMatches: BracketMatch[]
  firstRoundMatches: Match[]
}

export interface GenerateKnockoutOnlyInput {
  tournamentId: string
  playerIds: string[]
}

export interface GenerateKnockoutOnlyResult {
  knockoutPhaseId: string
  bracketMatches: BracketMatch[]
  firstRoundMatches: Match[]
  advancedByePlayerIds: string[]
}
