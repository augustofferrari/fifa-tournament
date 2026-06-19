export interface HeadToHeadInput {
  playerAId: string
  playerBId: string
}

export interface HeadToHeadLastMatch {
  tournamentName: string
  roundNumber: number
  date: string
  playerAGoals: number
  playerBGoals: number
  winnerPlayerId: string | null
}

export interface HeadToHeadStats {
  playerAId: string
  playerBId: string
  totalMatches: number
  playerAWins: number
  playerBWins: number
  draws: number
  playerAGoals: number
  playerBGoals: number
  lastMatches: HeadToHeadLastMatch[]
}
