export interface TournamentGroup {
  id: string
  tournamentId: string
  phaseId: string
  name: string
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface TournamentGroupPlayer {
  id: string
  groupId: string
  playerId: string
  seedPosition: number | null
  createdAt: string
}

export interface TournamentGroupPlayerAssignment {
  playerId: string
  seedPosition: number
}

export interface TournamentGroupWithPlayers extends TournamentGroup {
  players: TournamentGroupPlayerAssignment[]
}

export interface CreateTournamentGroupInput {
  tournamentId: string
  phaseId: string
  name: string
  orderIndex: number
}

export interface CreateTournamentGroupPlayerInput {
  groupId: string
  playerId: string
  seedPosition: number
}

export interface GenerateTournamentGroupsInput {
  tournamentId: string
  groupCount: number
  playerIds: string[]
}

export interface GenerateTournamentGroupsResult {
  groups: TournamentGroupWithPlayers[]
}
