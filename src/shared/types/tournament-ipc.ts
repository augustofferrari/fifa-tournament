import type { Player } from './player'
import type {
  CreateTournamentInput,
  ListTournamentsOptions,
  Tournament,
} from './tournament'
import type { TournamentPhase } from './tournament-phase'

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

export interface GetTournamentPhasesRequest {
  tournamentId: string
}

export type GetTournamentPhasesResponse = TournamentPhase[]

export interface GetTournamentStandingsRequest {
  tournamentId: string
  phaseId?: string
}

export type GetTournamentStandingsResponse = import('./standings').StandingRow[]

export interface GetTournamentGroupStandingsRequest {
  tournamentId: string
}

export type GetTournamentGroupStandingsResponse = import('./standings').GroupStandings[]

export interface GetTournamentGroupsRequest {
  tournamentId: string
}

export type GetTournamentGroupsResponse = import('./tournament-group').TournamentGroupWithPlayers[]

export interface GenerateTournamentGroupsRequest {
  tournamentId: string
  groupCount: number
  playerIds: string[]
}

export type GenerateTournamentGroupsResponse =
  import('./tournament-group').GenerateTournamentGroupsResult

export interface GenerateGroupStageFixtureRequest {
  tournamentId: string
}

export type GenerateGroupStageFixtureResponse = import('./match').Match[]

export interface GenerateKnockoutRequest {
  tournamentId: string
  qualifiersPerGroup: number
}

export type GenerateKnockoutResponse = import('./tournament-knockout').GenerateKnockoutResult

export interface GeneratePlayoffsRequest {
  tournamentId: string
  qualifiedCount: number
}

export type GeneratePlayoffsResponse = import('./tournament-playoff').GeneratePlayoffsResult

export interface GenerateKnockoutOnlyRequest {
  tournamentId: string
  playerIds: string[]
}

export type GenerateKnockoutOnlyResponse = import('./tournament-knockout').GenerateKnockoutOnlyResult

export interface GetBracketViewRequest {
  phaseId: string
}

export type GetBracketViewResponse = import('./bracket-view').BracketView

export interface GetTournamentAwardsRequest {
  tournamentId: string
}

export type GetTournamentAwardsResponse = import('./tournament-awards').TournamentAwards

export interface SetTournamentResultsUnlockedRequest {
  tournamentId: string
  resultsUnlocked: boolean
}

export type SetTournamentResultsUnlockedResponse = Tournament
