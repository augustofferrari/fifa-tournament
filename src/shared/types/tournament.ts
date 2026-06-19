import type { TournamentFormat } from './tournament-format'

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
  format: TournamentFormat
  hasGroupStage: boolean
  hasPlayoffs: boolean
  hasKnockoutStage: boolean
  playoffQualifiedCount: number | null
  groupCount: number | null
  playersPerGroup: number | null
  pointsWin: number
  pointsDraw: number
  pointsLoss: number
  resultsUnlocked: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTournamentInput {
  name: string
  format?: TournamentFormat
  playoffQualifiedCount?: number | null
  groupCount?: number | null
  playersPerGroup?: number | null
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

export { DEFAULT_TOURNAMENT_FORMAT, TournamentFormat } from './tournament-format'
