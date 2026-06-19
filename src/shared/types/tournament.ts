export type TournamentStatus = 'draft' | 'active' | 'finished'

export const TOURNAMENT_STATUSES: TournamentStatus[] = ['draft', 'active', 'finished']

export const DEFAULT_TOURNAMENT_SCORING = {
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
} as const

export interface Tournament {
  id: string
  name: string
  status: TournamentStatus
  pointsWin: number
  pointsDraw: number
  pointsLoss: number
  createdAt: string
  updatedAt: string
}

export interface CreateTournamentInput {
  name: string
  pointsWin?: number
  pointsDraw?: number
  pointsLoss?: number
}

export interface ListTournamentsOptions {
  status?: TournamentStatus
}

export interface AddPlayersToTournamentInput {
  playerIds: string[]
}
