import type { ListMatchesOptions, Match } from '@shared/types/match'
import type { LatestMatchResult } from '@shared/types/latest-match-result'
import type {
  GenerateFixtureResponse,
  GetLatestResultsResponse,
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
  getLatestResults(limit?: number): Promise<GetLatestResultsResponse>
}

export type { LatestMatchResult, Match }
