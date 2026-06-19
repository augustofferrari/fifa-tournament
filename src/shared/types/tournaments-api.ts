import type {
  CreateTournamentInput,
  ListTournamentsOptions,
  Tournament,
} from '@shared/types/tournament'
import type {
  AddPlayersToTournamentResponse,
  CreateTournamentResponse,
  GetTournamentByIdResponse,
  GetTournamentPlayersResponse,
  GetTournamentStandingsResponse,
  ListTournamentsResponse,
} from '@shared/types/tournament-ipc'
import type { StandingRow } from '@shared/types/standings'

export interface TournamentsNamespace {
  create(input: CreateTournamentInput): Promise<CreateTournamentResponse>
  getById(id: string): Promise<GetTournamentByIdResponse>
  list(options?: ListTournamentsOptions): Promise<ListTournamentsResponse>
  addPlayers(tournamentId: string, playerIds: string[]): Promise<AddPlayersToTournamentResponse>
  getPlayers(tournamentId: string): Promise<GetTournamentPlayersResponse>
  getStandings(tournamentId: string): Promise<GetTournamentStandingsResponse>
}

export type { StandingRow, Tournament }
