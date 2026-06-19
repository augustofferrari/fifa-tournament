import type { Match } from '@shared/types/match'
import type {
  TournamentAwards,
  TournamentBiggestWinAward,
  TournamentPlayerAward,
} from '@shared/types/tournament-awards'
import type { StandingRow } from '@shared/types/standings'

export interface CalculateTournamentAwardsInput {
  tournamentId: string
  standings: StandingRow[]
  matches: Match[]
}

function isPlayedMatch(match: Match): boolean {
  return match.status === 'played' && match.homeGoals !== null && match.awayGoals !== null
}

function toPlayerAward(row: StandingRow): TournamentPlayerAward {
  return {
    playerId: row.playerId,
    playerName: row.playerName,
  }
}

function standingsIndex(standings: StandingRow[], row: StandingRow): number {
  return standings.findIndex((entry) => entry.playerId === row.playerId)
}

function pickBestByMetric(
  standings: StandingRow[],
  isEligible: (row: StandingRow) => boolean,
  compare: (a: StandingRow, b: StandingRow) => number,
): StandingRow | null {
  const eligible = standings.filter(isEligible)

  if (eligible.length === 0) {
    return null
  }

  return [...eligible].sort((a, b) => {
    const metricComparison = compare(a, b)

    if (metricComparison !== 0) {
      return metricComparison
    }

    return standingsIndex(standings, a) - standingsIndex(standings, b)
  })[0]!
}

function findBiggestWin(
  matches: Match[],
  playerNamesById: Map<string, string>,
): TournamentBiggestWinAward | null {
  let best: TournamentBiggestWinAward | null = null

  for (const match of matches) {
    if (!isPlayedMatch(match)) {
      continue
    }

    const homeGoals = match.homeGoals!
    const awayGoals = match.awayGoals!

    if (homeGoals === awayGoals) {
      continue
    }

    const goalDifference = Math.abs(homeGoals - awayGoals)
    const homeWon = homeGoals > awayGoals
    const winnerPlayerId = homeWon ? match.homePlayerId : match.awayPlayerId
    const loserPlayerId = homeWon ? match.awayPlayerId : match.homePlayerId
    const winnerGoals = homeWon ? homeGoals : awayGoals
    const loserGoals = homeWon ? awayGoals : homeGoals

    const candidate: TournamentBiggestWinAward = {
      matchId: match.id,
      roundNumber: match.roundNumber,
      winnerPlayerId,
      winnerPlayerName: playerNamesById.get(winnerPlayerId) ?? winnerPlayerId,
      loserPlayerId,
      loserPlayerName: playerNamesById.get(loserPlayerId) ?? loserPlayerId,
      winnerGoals,
      loserGoals,
      goalDifference,
    }

    if (
      !best ||
      candidate.goalDifference > best.goalDifference ||
      (candidate.goalDifference === best.goalDifference &&
        candidate.winnerGoals > best.winnerGoals)
    ) {
      best = candidate
    }
  }

  return best
}

export function calculateTournamentAwards(input: CalculateTournamentAwardsInput): TournamentAwards {
  const { tournamentId, standings, matches } = input
  const playedMatches = matches.filter(isPlayedMatch)
  const hasPlayedMatches = playedMatches.length > 0

  const playerNamesById = new Map(
    standings.map((row) => [row.playerId, row.playerName]),
  )

  const champion =
    hasPlayedMatches && standings[0] ? toPlayerAward(standings[0]) : null

  const runnerUp =
    hasPlayedMatches && standings.length >= 2 && standings[1]
      ? toPlayerAward(standings[1])
      : null

  const topScorerRow = pickBestByMetric(
    standings,
    (row) => row.goalsFor > 0,
    (a, b) => b.goalsFor - a.goalsFor,
  )

  const bestDefenseRow = pickBestByMetric(
    standings,
    (row) => row.played > 0,
    (a, b) => a.goalsAgainst - b.goalsAgainst,
  )

  const mostWinsRow = pickBestByMetric(
    standings,
    (row) => row.won > 0,
    (a, b) => b.won - a.won,
  )

  return {
    tournamentId,
    champion,
    runnerUp,
    topScorer: topScorerRow ? toPlayerAward(topScorerRow) : null,
    bestDefense: bestDefenseRow ? toPlayerAward(bestDefenseRow) : null,
    biggestWin: hasPlayedMatches ? findBiggestWin(matches, playerNamesById) : null,
    mostWins: mostWinsRow ? toPlayerAward(mostWinsRow) : null,
  }
}
