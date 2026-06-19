export type MatchStatus = 'scheduled' | 'played' | 'cancelled'

export const MATCH_STATUSES: MatchStatus[] = ['scheduled', 'played', 'cancelled']

export interface Match {
  id: string
  tournamentId: string
  roundNumber: number
  homePlayerId: string
  awayPlayerId: string
  homeGoals: number | null
  awayGoals: number | null
  status: MatchStatus
  createdAt: string
  updatedAt: string
}

export interface ListMatchesOptions {
  tournamentId: string
  roundNumber?: number
}

export interface UpdateMatchResultInput {
  homeGoals: number
  awayGoals: number
}
