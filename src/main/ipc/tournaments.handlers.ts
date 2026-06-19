import { ipcMain } from 'electron'
import { getTournamentRepository } from '@modules/tournaments'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type {
  AddPlayersToTournamentRequest,
  AddPlayersToTournamentResponse,
  CreateTournamentRequest,
  CreateTournamentResponse,
  GetTournamentByIdRequest,
  GetTournamentByIdResponse,
  GetTournamentPlayersRequest,
  GetTournamentPlayersResponse,
  GetTournamentStandingsRequest,
  GetTournamentStandingsResponse,
  ListTournamentsRequest,
  ListTournamentsResponse,
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
    IPC_CHANNELS.TOURNAMENTS_GET_STANDINGS,
    (_event, request: GetTournamentStandingsRequest) =>
      runIpcHandler<GetTournamentStandingsResponse>(() =>
        getTournamentRepository().getTournamentStandings(request.tournamentId),
      ),
  )
}
