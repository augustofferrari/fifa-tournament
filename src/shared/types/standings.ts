export interface StandingRow {
  playerId: string
  playerName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface GroupStandings {
  groupId: string
  groupName: string
  standings: StandingRow[]
}
