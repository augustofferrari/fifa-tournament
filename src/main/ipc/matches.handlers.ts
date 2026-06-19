import { ipcMain } from 'electron'
import { getMatchRepository } from '@modules/matches'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type {
  GenerateFixtureRequest,
  GenerateFixtureResponse,
  ListMatchesRequest,
  ListMatchesResponse,
  UpdateMatchResultRequest,
  UpdateMatchResultResponse,
} from '@shared/types/match-ipc'
import { runIpcHandler } from './utils'

export function registerMatchHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.MATCHES_GENERATE_FIXTURE,
    (_event, request: GenerateFixtureRequest) =>
      runIpcHandler<GenerateFixtureResponse>(() =>
        getMatchRepository().generateFixtureForTournament(request.tournamentId),
      ),
  )

  ipcMain.handle(IPC_CHANNELS.MATCHES_LIST, (_event, request: ListMatchesRequest) =>
    runIpcHandler<ListMatchesResponse>(() => getMatchRepository().listMatchesByTournament(request)),
  )

  ipcMain.handle(
    IPC_CHANNELS.MATCHES_UPDATE_RESULT,
    (_event, request: UpdateMatchResultRequest) =>
      runIpcHandler<UpdateMatchResultResponse>(() =>
        getMatchRepository().updateMatchResult(
          request.matchId,
          request.homeGoals,
          request.awayGoals,
        ),
      ),
  )
}
