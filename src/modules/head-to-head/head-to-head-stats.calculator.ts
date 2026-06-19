import type { Match } from '@shared/types/match'
import type { HeadToHeadLastMatch, HeadToHeadStats } from '@shared/types/head-to-head'

export interface CalculateHeadToHeadStatsInput {
  playerAId: string
  playerBId: string
  matches: Match[]
  tournamentNamesById: Map<string, string>
}

function isPlayedMatch(match: Match): boolean {
  return match.status === 'played' && match.homeGoals !== null && match.awayGoals !== null
}

function isHeadToHeadMatch(match: Match, playerAId: string, playerBId: string): boolean {
  const participants = new Set([match.homePlayerId, match.awayPlayerId])
  return participants.has(playerAId) && participants.has(playerBId)
}

function getGoalsForPlayer(match: Match, playerId: string): number {
  if (match.homePlayerId === playerId) {
    return match.homeGoals!
  }

  if (match.awayPlayerId === playerId) {
    return match.awayGoals!
  }

  throw new Error(`Player ${playerId} did not participate in match ${match.id}`)
}

function resolveWinner(playerAGoals: number, playerBGoals: number, playerAId: string, playerBId: string): string | null {
  if (playerAGoals > playerBGoals) {
    return playerAId
  }

  if (playerBGoals > playerAGoals) {
    return playerBId
  }

  return null
}

function toLastMatch(
  match: Match,
  playerAId: string,
  playerBId: string,
  tournamentNamesById: Map<string, string>,
): HeadToHeadLastMatch {
  const playerAGoals = getGoalsForPlayer(match, playerAId)
  const playerBGoals = getGoalsForPlayer(match, playerBId)

  return {
    tournamentName: tournamentNamesById.get(match.tournamentId) ?? 'Unknown tournament',
    roundNumber: match.roundNumber,
    date: match.updatedAt,
    playerAGoals,
    playerBGoals,
    winnerPlayerId: resolveWinner(playerAGoals, playerBGoals, playerAId, playerBId),
  }
}

export function calculateHeadToHeadStats(input: CalculateHeadToHeadStatsInput): HeadToHeadStats {
  const { playerAId, playerBId, tournamentNamesById } = input

  const headToHeadMatches = input.matches
    .filter(
      (match) =>
        isPlayedMatch(match) && isHeadToHeadMatch(match, playerAId, playerBId),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  let playerAWins = 0
  let playerBWins = 0
  let draws = 0
  let playerAGoals = 0
  let playerBGoals = 0

  const lastMatches: HeadToHeadLastMatch[] = headToHeadMatches.map((match) => {
    const matchPlayerAGoals = getGoalsForPlayer(match, playerAId)
    const matchPlayerBGoals = getGoalsForPlayer(match, playerBId)

    playerAGoals += matchPlayerAGoals
    playerBGoals += matchPlayerBGoals

    if (matchPlayerAGoals > matchPlayerBGoals) {
      playerAWins += 1
    } else if (matchPlayerBGoals > matchPlayerAGoals) {
      playerBWins += 1
    } else {
      draws += 1
    }

    return toLastMatch(match, playerAId, playerBId, tournamentNamesById)
  })

  return {
    playerAId,
    playerBId,
    totalMatches: headToHeadMatches.length,
    playerAWins,
    playerBWins,
    draws,
    playerAGoals,
    playerBGoals,
    lastMatches,
  }
}
