export type MatchStatus = 'scheduled' | 'played' | 'cancelled'

export const MATCH_STATUSES: MatchStatus[] = ['scheduled', 'played', 'cancelled']

export interface Match {
  id: string
  tournamentId: string
  phaseId: string | null
  groupId: string | null
  bracketRound: string | null
  bracketPosition: number | null
  roundNumber: number
  homePlayerId: string
  awayPlayerId: string
  homeGoals: number | null
  awayGoals: number | null
  status: MatchStatus
  createdAt: string
  updatedAt: string
}

export interface CreateMatchInput {
  tournamentId: string
  phaseId: string
  roundNumber: number
  homePlayerId: string
  awayPlayerId: string
  groupId?: string | null
  bracketRound?: string | null
  bracketPosition?: number | null
}

export interface ListMatchesOptions {
  tournamentId: string
  roundNumber?: number
}

export interface UpdateMatchResultInput {
  homeGoals: number
  awayGoals: number
}

export const EMPTY_MATCH_PHASE_FIELDS = {
  phaseId: null,
  groupId: null,
  bracketRound: null,
  bracketPosition: null,
} as const
