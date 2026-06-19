export interface PlayerHistoricalStats {
  playerId: string
  playerName: string
  tournamentsPlayed: number
  tournamentsWon: number
  matchesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  winRate: number
}

export interface TournamentPlayerEntry {
  tournamentId: string
  playerId: string
}

export interface HistoricalStatsSnapshot {
  players: PlayerHistoricalStats[]
}
