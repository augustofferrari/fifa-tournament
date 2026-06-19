export enum BracketRound {
  FINAL = 'FINAL',
  SEMIFINAL = 'SEMIFINAL',
  QUARTERFINAL = 'QUARTERFINAL',
  ROUND_OF_16 = 'ROUND_OF_16',
}

export const BRACKET_ROUNDS: BracketRound[] = [
  BracketRound.FINAL,
  BracketRound.SEMIFINAL,
  BracketRound.QUARTERFINAL,
  BracketRound.ROUND_OF_16,
]

export enum BracketSourceType {
  PLAYER = 'PLAYER',
  STANDING_POSITION = 'STANDING_POSITION',
  GROUP_POSITION = 'GROUP_POSITION',
  MATCH_WINNER = 'MATCH_WINNER',
}

export const BRACKET_SOURCE_TYPES: BracketSourceType[] = [
  BracketSourceType.PLAYER,
  BracketSourceType.STANDING_POSITION,
  BracketSourceType.GROUP_POSITION,
  BracketSourceType.MATCH_WINNER,
]

export enum BracketNextMatchSlot {
  HOME = 'HOME',
  AWAY = 'AWAY',
}

export const BRACKET_NEXT_MATCH_SLOTS: BracketNextMatchSlot[] = [
  BracketNextMatchSlot.HOME,
  BracketNextMatchSlot.AWAY,
]

export interface BracketMatch {
  id: string
  tournamentId: string
  phaseId: string
  matchId: string | null
  bracketRound: BracketRound
  bracketPosition: number
  homeSourceType: BracketSourceType
  homeSourceRef: string | null
  awaySourceType: BracketSourceType
  awaySourceRef: string | null
  winnerPlayerId: string | null
  nextMatchId: string | null
  nextMatchSlot: BracketNextMatchSlot | null
  createdAt: string
  updatedAt: string
}

export interface CreateBracketMatchInput {
  id?: string
  tournamentId: string
  phaseId: string
  matchId?: string | null
  bracketRound: BracketRound
  bracketPosition: number
  homeSourceType: BracketSourceType
  homeSourceRef: string | null
  awaySourceType: BracketSourceType
  awaySourceRef: string | null
  winnerPlayerId?: string | null
  nextMatchId?: string | null
  nextMatchSlot?: BracketNextMatchSlot | null
}
