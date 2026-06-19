import type { Match, ListMatchesOptions } from './match'

export interface GenerateFixtureRequest {
  tournamentId: string
}

export type GenerateFixtureResponse = Match[]

export type ListMatchesRequest = ListMatchesOptions
export type ListMatchesResponse = Match[]

export interface UpdateMatchResultRequest {
  matchId: string
  homeGoals: number
  awayGoals: number
}

export type UpdateMatchResultResponse = Match
