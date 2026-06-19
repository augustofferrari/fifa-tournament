export interface TournamentPlayerAward {
  playerId: string
  playerName: string
}

export interface TournamentBiggestWinAward {
  matchId: string
  roundNumber: number
  winnerPlayerId: string
  winnerPlayerName: string
  loserPlayerId: string
  loserPlayerName: string
  winnerGoals: number
  loserGoals: number
  goalDifference: number
}

export interface TournamentAwards {
  tournamentId: string
  champion: TournamentPlayerAward | null
  runnerUp: TournamentPlayerAward | null
  topScorer: TournamentPlayerAward | null
  bestDefense: TournamentPlayerAward | null
  biggestWin: TournamentBiggestWinAward | null
  mostWins: TournamentPlayerAward | null
}
