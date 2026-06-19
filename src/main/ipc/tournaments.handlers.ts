import { ipcMain } from 'electron'
import { getTournamentAwardsService } from '@modules/tournament-awards'
import { getTournamentNarrativeService } from '@modules/tournament-narratives'
import {
  getGroupGenerationService,
  getGroupStageFixtureService,
  getGroupStandingsService,
} from '@modules/tournament-groups'
import { getKnockoutGenerationService, getKnockoutOnlyGenerationService } from '@modules/tournament-knockout'
import { getBracketViewService, getPlayoffGenerationService } from '@modules/tournament-playoffs'
import { getTournamentPhaseService } from '@modules/tournament-phases'
import { getTournamentRepository } from '@modules/tournaments'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type {
  AddPlayersToTournamentRequest,
  AddPlayersToTournamentResponse,
  CreateTournamentRequest,
  CreateTournamentResponse,
  GetTournamentAwardsRequest,
  GetTournamentAwardsResponse,
  GetTournamentNarrativeRequest,
  GetTournamentNarrativeResponse,
  GetTournamentByIdRequest,
  GetTournamentByIdResponse,
  GetTournamentPlayersRequest,
  GetTournamentPlayersResponse,
  GetTournamentPhasesRequest,
  GetTournamentPhasesResponse,
  GetTournamentStandingsRequest,
  GetTournamentStandingsResponse,
  GetTournamentGroupStandingsRequest,
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
  ListTournamentsRequest,
  ListTournamentsResponse,
  SetTournamentResultsUnlockedRequest,
  SetTournamentResultsUnlockedResponse,
} from '@shared/types/tournament-ipc'
import { runIpcHandler } from './utils'

export function registerTournamentHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_CREATE,
    (_event, request: CreateTournamentRequest) =>
      runIpcHandler<CreateTournamentResponse>(() => getTournamentRepository().createTournament(request)),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GET_BY_ID,
    (_event, request: GetTournamentByIdRequest) =>
      runIpcHandler<GetTournamentByIdResponse>(() =>
        getTournamentRepository().getTournamentById(request.id),
      ),
  )

  ipcMain.handle(IPC_CHANNELS.TOURNAMENTS_LIST, (_event, request: ListTournamentsRequest = {}) =>
    runIpcHandler<ListTournamentsResponse>(() => getTournamentRepository().listTournaments(request)),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_ADD_PLAYERS,
    (_event, request: AddPlayersToTournamentRequest) =>
      runIpcHandler<AddPlayersToTournamentResponse>(() =>
        getTournamentRepository().addPlayersToTournament(
          request.tournamentId,
          request.playerIds,
        ),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GET_PLAYERS,
    (_event, request: GetTournamentPlayersRequest) =>
      runIpcHandler<GetTournamentPlayersResponse>(() =>
        getTournamentRepository().getTournamentPlayers(request.tournamentId),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GET_PHASES,
    (_event, request: GetTournamentPhasesRequest) =>
      runIpcHandler<GetTournamentPhasesResponse>(() =>
        getTournamentPhaseService().getTournamentPhases(request.tournamentId),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GET_STANDINGS,
    (_event, request: GetTournamentStandingsRequest) =>
      runIpcHandler<GetTournamentStandingsResponse>(() =>
        getTournamentRepository().getTournamentStandings(request.tournamentId, request.phaseId),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GET_GROUPS,
    (_event, request: GetTournamentGroupsRequest) =>
      runIpcHandler<GetTournamentGroupsResponse>(() =>
        getGroupGenerationService().listGroupsWithPlayers(request.tournamentId),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GENERATE_GROUPS,
    (_event, request: GenerateTournamentGroupsRequest) =>
      runIpcHandler<GenerateTournamentGroupsResponse>(() => {
        getTournamentPhaseService().ensurePhasesForTournament(request.tournamentId)

        return getGroupGenerationService().generateGroups({
          tournamentId: request.tournamentId,
          groupCount: request.groupCount,
          playerIds: request.playerIds,
        })
      }),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GENERATE_GROUP_FIXTURE,
    (_event, request: GenerateGroupStageFixtureRequest) =>
      runIpcHandler<GenerateGroupStageFixtureResponse>(() => {
        getTournamentPhaseService().ensurePhasesForTournament(request.tournamentId)

        return getGroupStageFixtureService().generateFixture(request.tournamentId)
      }),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GENERATE_KNOCKOUT,
    (_event, request: GenerateKnockoutRequest) =>
      runIpcHandler<GenerateKnockoutResponse>(() =>
        getKnockoutGenerationService().generateKnockout({
          tournamentId: request.tournamentId,
          qualifiersPerGroup: request.qualifiersPerGroup,
        }),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GET_GROUP_STANDINGS,
    (_event, request: GetTournamentGroupStandingsRequest) =>
      runIpcHandler<GetTournamentGroupStandingsResponse>(() =>
        getGroupStandingsService().getGroupStandings(request.tournamentId),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GENERATE_PLAYOFFS,
    (_event, request: GeneratePlayoffsRequest) =>
      runIpcHandler<GeneratePlayoffsResponse>(() =>
        getPlayoffGenerationService().generatePlayoffs({
          tournamentId: request.tournamentId,
          qualifiedCount: request.qualifiedCount,
        }),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GENERATE_KNOCKOUT_ONLY,
    (_event, request: GenerateKnockoutOnlyRequest) =>
      runIpcHandler<GenerateKnockoutOnlyResponse>(() => {
        getTournamentPhaseService().ensurePhasesForTournament(request.tournamentId)

        return getKnockoutOnlyGenerationService().generateKnockout({
          tournamentId: request.tournamentId,
          playerIds: request.playerIds,
        })
      }),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GET_BRACKET_VIEW,
    (_event, request: GetBracketViewRequest) =>
      runIpcHandler<GetBracketViewResponse>(() =>
        getBracketViewService().getBracketView(request.phaseId),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GET_AWARDS,
    (_event, request: GetTournamentAwardsRequest) =>
      runIpcHandler<GetTournamentAwardsResponse>(() =>
        getTournamentAwardsService().getTournamentAwards(request.tournamentId),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_GET_NARRATIVE,
    (_event, request: GetTournamentNarrativeRequest) =>
      runIpcHandler<GetTournamentNarrativeResponse>(() =>
        getTournamentNarrativeService().getTournamentNarrative(request.tournamentId),
      ),
  )

  ipcMain.handle(
    IPC_CHANNELS.TOURNAMENTS_SET_RESULTS_UNLOCKED,
    (_event, request: SetTournamentResultsUnlockedRequest) =>
      runIpcHandler<SetTournamentResultsUnlockedResponse>(() =>
        getTournamentRepository().setResultsUnlocked(
          request.tournamentId,
          request.resultsUnlocked,
        ),
      ),
  )
}
