import type { Player } from './player'
import type {
  CreateTournamentInput,
  ListTournamentsOptions,
  Tournament,
} from './tournament'

export type CreateTournamentRequest = CreateTournamentInput
export type CreateTournamentResponse = Tournament

export interface GetTournamentByIdRequest {
  id: string
}
export type GetTournamentByIdResponse = Tournament | null

export type ListTournamentsRequest = ListTournamentsOptions
export type ListTournamentsResponse = Tournament[]

export interface AddPlayersToTournamentRequest {
  tournamentId: string
  playerIds: string[]
}
export type AddPlayersToTournamentResponse = Player[]

export interface GetTournamentPlayersRequest {
  tournamentId: string
}
export type GetTournamentPlayersResponse = Player[]

export interface GetTournamentStandingsRequest {
  tournamentId: string
}

export type GetTournamentStandingsResponse = import('./standings').StandingRow[]
