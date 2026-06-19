import type {
  CreateTournamentInput,
  ListTournamentsOptions,
  Tournament,
} from '@shared/types/tournament'
import type {
  AddPlayersToTournamentResponse,
  CreateTournamentResponse,
  GetTournamentAwardsResponse,
  GetTournamentByIdResponse,
  GetTournamentPhasesResponse,
  GetTournamentPlayersResponse,
  GetTournamentStandingsResponse,
  GetTournamentGroupStandingsResponse,
  GetTournamentGroupsRequest,
  GetTournamentGroupsResponse,
  GenerateTournamentGroupsRequest,
  GenerateTournamentGroupsResponse,
  GenerateGroupStageFixtureRequest,
  GenerateGroupStageFixtureResponse,
  GenerateKnockoutRequest,
  GenerateKnockoutResponse,
  GeneratePlayoffsRequest,
  GeneratePlayoffsResponse,
  GenerateKnockoutOnlyRequest,
  GenerateKnockoutOnlyResponse,
  GetBracketViewRequest,
  GetBracketViewResponse,
  ListTournamentsResponse,
  SetTournamentResultsUnlockedResponse,
} from '@shared/types/tournament-ipc'
import type { TournamentPhase } from '@shared/types/tournament-phase'
import type { BracketView } from '@shared/types/bracket-view'
import type { GenerateKnockoutOnlyResult, GenerateKnockoutResult } from '@shared/types/tournament-knockout'
import type { GeneratePlayoffsResult } from '@shared/types/tournament-playoff'
import type { TournamentGroupWithPlayers, GenerateTournamentGroupsResult } from '@shared/types/tournament-group'
import type { Match } from '@shared/types/match'
import type { GroupStandings, StandingRow } from '@shared/types/standings'
import type { TournamentAwards } from '@shared/types/tournament-awards'

export interface TournamentsNamespace {
  create(input: CreateTournamentInput): Promise<CreateTournamentResponse>
  getById(id: string): Promise<GetTournamentByIdResponse>
  list(options?: ListTournamentsOptions): Promise<ListTournamentsResponse>
  addPlayers(tournamentId: string, playerIds: string[]): Promise<AddPlayersToTournamentResponse>
  getPlayers(tournamentId: string): Promise<GetTournamentPlayersResponse>
  getPhases(tournamentId: string): Promise<GetTournamentPhasesResponse>
  getStandings(tournamentId: string, phaseId?: string): Promise<GetTournamentStandingsResponse>
  getGroupStandings(tournamentId: string): Promise<GetTournamentGroupStandingsResponse>
  getGroups(tournamentId: string): Promise<GetTournamentGroupsResponse>
  generateGroups(
    tournamentId: string,
    groupCount: number,
    playerIds: string[],
  ): Promise<GenerateTournamentGroupsResponse>
  generateGroupFixture(tournamentId: string): Promise<GenerateGroupStageFixtureResponse>
  generateKnockout(
    tournamentId: string,
    qualifiersPerGroup: number,
  ): Promise<GenerateKnockoutResponse>
  generatePlayoffs(tournamentId: string, qualifiedCount: number): Promise<GeneratePlayoffsResponse>
  generateKnockoutOnly(
    tournamentId: string,
    playerIds: string[],
  ): Promise<GenerateKnockoutOnlyResponse>
  getBracketView(phaseId: string): Promise<GetBracketViewResponse>
  getAwards(tournamentId: string): Promise<GetTournamentAwardsResponse>
  setResultsUnlocked(
    tournamentId: string,
    resultsUnlocked: boolean,
  ): Promise<SetTournamentResultsUnlockedResponse>
}

export type {
  BracketView,
  GenerateKnockoutOnlyResult,
  GenerateKnockoutResult,
  GeneratePlayoffsResult,
  GenerateTournamentGroupsResult,
  GroupStandings,
  Match,
  StandingRow,
  Tournament,
  TournamentAwards,
  TournamentGroupWithPlayers,
  TournamentPhase,
}
