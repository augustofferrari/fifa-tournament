export enum TournamentPhaseType {
  ROUND_ROBIN = 'ROUND_ROBIN',
  GROUP_STAGE = 'GROUP_STAGE',
  PLAYOFF = 'PLAYOFF',
  KNOCKOUT = 'KNOCKOUT',
}

export const TOURNAMENT_PHASE_TYPES: TournamentPhaseType[] = [
  TournamentPhaseType.ROUND_ROBIN,
  TournamentPhaseType.GROUP_STAGE,
  TournamentPhaseType.PLAYOFF,
  TournamentPhaseType.KNOCKOUT,
]

export type TournamentPhaseStatus = 'pending' | 'active' | 'completed'

export const TOURNAMENT_PHASE_STATUSES: TournamentPhaseStatus[] = [
  'pending',
  'active',
  'completed',
]

export interface TournamentPhase {
  id: string
  tournamentId: string
  phaseType: TournamentPhaseType
  name: string
  orderIndex: number
  status: TournamentPhaseStatus
  createdAt: string
  updatedAt: string
}

export interface CreateTournamentPhaseInput {
  tournamentId: string
  phaseType: TournamentPhaseType
  name: string
  orderIndex: number
  status: TournamentPhaseStatus
}
