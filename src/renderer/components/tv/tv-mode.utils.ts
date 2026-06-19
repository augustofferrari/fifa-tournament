import type { LatestMatchResult } from '@shared/types/latest-match-result'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import { TournamentPhaseType, type TournamentPhase } from '@shared/types/tournament-phase'
import { getPlayerDisplayName } from '@shared/validation'

export const TV_MODE_REFRESH_MS = 20_000
export const TV_LATEST_RESULTS_LIMIT = 6
export const TV_NEXT_MATCHES_LIMIT = 6

export function resolveDisplayPhase(phases: TournamentPhase[]): TournamentPhase | null {
  if (phases.length === 0) {
    return null
  }

  const activePhase = phases.find((phase) => phase.status === 'active')

  if (activePhase) {
    return activePhase
  }

  const sortedByOrder = [...phases].sort((left, right) => right.orderIndex - left.orderIndex)
  const latestCompleted = sortedByOrder.find((phase) => phase.status === 'completed')

  if (latestCompleted) {
    return latestCompleted
  }

  return [...phases].sort((left, right) => left.orderIndex - right.orderIndex)[0] ?? null
}

export function isBracketPhase(phaseType: TournamentPhaseType): boolean {
  return phaseType === TournamentPhaseType.PLAYOFF || phaseType === TournamentPhaseType.KNOCKOUT
}

export function isGroupStandingsPhase(phaseType: TournamentPhaseType): boolean {
  return phaseType === TournamentPhaseType.GROUP_STAGE
}

export function filterLatestResultsForTournament(
  results: LatestMatchResult[],
  tournamentId: string,
  limit = TV_LATEST_RESULTS_LIMIT,
): LatestMatchResult[] {
  return results.filter((result) => result.tournamentId === tournamentId).slice(0, limit)
}

export function getNextMatchesForPhase(
  matches: Match[],
  phase: TournamentPhase | null,
  limit = TV_NEXT_MATCHES_LIMIT,
): Match[] {
  if (!phase) {
    return []
  }

  return matches
    .filter((match) => match.phaseId === phase.id && match.status === 'scheduled')
    .sort((left, right) => {
      if (left.roundNumber !== right.roundNumber) {
        return left.roundNumber - right.roundNumber
      }

      const leftPosition = left.bracketPosition ?? 0
      const rightPosition = right.bracketPosition ?? 0

      if (leftPosition !== rightPosition) {
        return leftPosition - rightPosition
      }

      return left.createdAt.localeCompare(right.createdAt)
    })
    .slice(0, limit)
}

export function buildPlayersById(players: Player[]): Map<string, Player> {
  return new Map(players.map((player) => [player.id, player]))
}

export function getMatchPlayerLabel(
  playersById: Map<string, Player>,
  playerId: string,
): string {
  return getPlayerDisplayName(playersById, playerId)
}

export function formatPhaseStatus(status: TournamentPhase['status']): string {
  switch (status) {
    case 'active':
      return 'In progress'
    case 'completed':
      return 'Completed'
    case 'pending':
      return 'Upcoming'
  }
}

export function formatTournamentStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
