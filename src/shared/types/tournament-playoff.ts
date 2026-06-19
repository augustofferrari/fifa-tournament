import type { BracketMatch } from './bracket-match'
import type { Match } from './match'

export interface GeneratePlayoffsInput {
  tournamentId: string
  qualifiedCount: number
}

export interface GeneratePlayoffsResult {
  playoffPhaseId: string
  bracketMatches: BracketMatch[]
  firstRoundMatches: Match[]
}
