import type { ListMatchesOptions, Match } from '@shared/types/match'
import type {
  GenerateFixtureResponse,
  ListMatchesResponse,
  UpdateMatchResultResponse,
} from '@shared/types/match-ipc'

export interface MatchesNamespace {
  generateFixture(tournamentId: string): Promise<GenerateFixtureResponse>
  list(options: ListMatchesOptions): Promise<ListMatchesResponse>
  updateResult(
    matchId: string,
    homeGoals: number,
    awayGoals: number,
  ): Promise<UpdateMatchResultResponse>
}

export type { Match }
