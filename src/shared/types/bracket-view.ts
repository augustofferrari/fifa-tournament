import type { BracketRound } from './bracket-match'
import type { MatchStatus } from './match'

export interface BracketParticipantSlot {
  label: string
  playerId: string | null
  score: number | null
  isPending: boolean
}

export type BracketViewMatchStatus = MatchStatus | 'pending'

export interface BracketViewMatch {
  bracketMatchId: string
  bracketRound: BracketRound
  bracketPosition: number
  matchId: string | null
  status: BracketViewMatchStatus
  home: BracketParticipantSlot
  away: BracketParticipantSlot
  canEnterResult: boolean
}

export interface BracketViewRound {
  round: BracketRound
  label: string
  matches: BracketViewMatch[]
}

export interface BracketView {
  phaseId: string
  rounds: BracketViewRound[]
}
