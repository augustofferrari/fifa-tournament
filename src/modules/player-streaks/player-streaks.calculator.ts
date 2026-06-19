import type { Match } from '@shared/types/match'
import type { PlayerStreaks } from '@shared/types/player-streaks'

export interface CalculatePlayerStreaksInput {
  playerId: string
  matches: Match[]
}

export type MatchOutcome = 'win' | 'draw' | 'loss'

function isPlayedMatch(match: Match): boolean {
  return match.status === 'played' && match.homeGoals !== null && match.awayGoals !== null
}

function playerParticipatedInMatch(match: Match, playerId: string): boolean {
  return match.homePlayerId === playerId || match.awayPlayerId === playerId
}

export function getGoalsForPlayer(match: Match, playerId: string): number {
  if (match.homePlayerId === playerId) {
    return match.homeGoals!
  }

  if (match.awayPlayerId === playerId) {
    return match.awayGoals!
  }

  throw new Error(`Player ${playerId} did not participate in match ${match.id}`)
}

export function getGoalsAgainstPlayer(match: Match, playerId: string): number {
  if (match.homePlayerId === playerId) {
    return match.awayGoals!
  }

  if (match.awayPlayerId === playerId) {
    return match.homeGoals!
  }

  throw new Error(`Player ${playerId} did not participate in match ${match.id}`)
}

export function getMatchOutcomeForPlayer(match: Match, playerId: string): MatchOutcome {
  const goalsFor = getGoalsForPlayer(match, playerId)
  const goalsAgainst = getGoalsAgainstPlayer(match, playerId)

  if (goalsFor > goalsAgainst) {
    return 'win'
  }

  if (goalsFor < goalsAgainst) {
    return 'loss'
  }

  return 'draw'
}

export function sortMatchesByUpdatedAtAsc(matches: readonly Match[]): Match[] {
  return [...matches].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
}

export function createEmptyPlayerStreaks(playerId: string): PlayerStreaks {
  return {
    playerId,
    currentWinStreak: 0,
    currentUnbeatenStreak: 0,
    currentLosingStreak: 0,
    bestWinStreak: 0,
    bestUnbeatenStreak: 0,
  }
}

interface MutablePlayerStreakState {
  currentWinStreak: number
  currentUnbeatenStreak: number
  currentLosingStreak: number
  bestWinStreak: number
  bestUnbeatenStreak: number
}

function createMutableStreakState(): MutablePlayerStreakState {
  return {
    currentWinStreak: 0,
    currentUnbeatenStreak: 0,
    currentLosingStreak: 0,
    bestWinStreak: 0,
    bestUnbeatenStreak: 0,
  }
}

function applyOutcomeToStreakState(state: MutablePlayerStreakState, outcome: MatchOutcome): void {
  if (outcome === 'win') {
    state.currentWinStreak += 1
    state.currentUnbeatenStreak += 1
    state.currentLosingStreak = 0
  } else if (outcome === 'draw') {
    state.currentWinStreak = 0
    state.currentUnbeatenStreak += 1
    state.currentLosingStreak = 0
  } else {
    state.currentWinStreak = 0
    state.currentUnbeatenStreak = 0
    state.currentLosingStreak += 1
  }

  state.bestWinStreak = Math.max(state.bestWinStreak, state.currentWinStreak)
  state.bestUnbeatenStreak = Math.max(state.bestUnbeatenStreak, state.currentUnbeatenStreak)
}

function toPlayerStreaks(playerId: string, state: MutablePlayerStreakState): PlayerStreaks {
  return {
    playerId,
    currentWinStreak: state.currentWinStreak,
    currentUnbeatenStreak: state.currentUnbeatenStreak,
    currentLosingStreak: state.currentLosingStreak,
    bestWinStreak: state.bestWinStreak,
    bestUnbeatenStreak: state.bestUnbeatenStreak,
  }
}

export function calculateAllPlayerStreaks(
  playerIds: readonly string[],
  matches: readonly Match[],
): PlayerStreaks[] {
  const states = new Map<string, MutablePlayerStreakState>(
    playerIds.map((playerId) => [playerId, createMutableStreakState()]),
  )
  const chronologicalMatches = sortMatchesByUpdatedAtAsc(matches.filter(isPlayedMatch))

  for (const match of chronologicalMatches) {
    for (const playerId of [match.homePlayerId, match.awayPlayerId]) {
      const state = states.get(playerId)

      if (!state) {
        continue
      }

      applyOutcomeToStreakState(state, getMatchOutcomeForPlayer(match, playerId))
    }
  }

  return playerIds.map((playerId) =>
    toPlayerStreaks(playerId, states.get(playerId) ?? createMutableStreakState()),
  )
}

export function calculatePlayerStreaks(input: CalculatePlayerStreaksInput): PlayerStreaks {
  const { playerId } = input
  const state = createMutableStreakState()
  const chronologicalMatches = sortMatchesByUpdatedAtAsc(
    input.matches.filter(
      (match) => isPlayedMatch(match) && playerParticipatedInMatch(match, playerId),
    ),
  )

  for (const match of chronologicalMatches) {
    applyOutcomeToStreakState(state, getMatchOutcomeForPlayer(match, playerId))
  }

  return toPlayerStreaks(playerId, state)
}
