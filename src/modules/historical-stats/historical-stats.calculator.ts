import type { Match } from '@shared/types/match'
import type {
  HistoricalStatsSnapshot,
  PlayerHistoricalStats,
  TournamentPlayerEntry,
} from '@shared/types/historical-stats'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import { createRemovedPlayer } from '@shared/validation'
import { calculateStandings } from '@modules/tournaments/standings.calculator'

export interface CalculateHistoricalStatsInput {
  players: Player[]
  tournaments: Tournament[]
  tournamentPlayers: TournamentPlayerEntry[]
  matches: Match[]
}

function createEmptyStats(player: Player): PlayerHistoricalStats {
  return {
    playerId: player.id,
    playerName: player.name,
    tournamentsPlayed: 0,
    tournamentsWon: 0,
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    winRate: 0,
  }
}

function isPlayedMatch(match: Match): boolean {
  return match.status === 'played' && match.homeGoals !== null && match.awayGoals !== null
}

function isTournamentComplete(matches: Match[]): boolean {
  return matches.length > 0 && matches.every((match) => match.status !== 'scheduled')
}

function getPlayersForTournament(
  tournamentPlayers: TournamentPlayerEntry[],
  matches: Match[],
  playersById: Map<string, Player>,
  tournamentId: string,
): Player[] {
  const rosterIds = new Set(
    tournamentPlayers
      .filter((entry) => entry.tournamentId === tournamentId)
      .map((entry) => entry.playerId),
  )

  for (const match of matches) {
    rosterIds.add(match.homePlayerId)
    rosterIds.add(match.awayPlayerId)
  }

  return [...rosterIds].map((playerId) => playersById.get(playerId) ?? createRemovedPlayer(playerId))
}

function sortHistoricalStats(rows: PlayerHistoricalStats[]): PlayerHistoricalStats[] {
  return [...rows].sort((a, b) => {
    if (b.tournamentsWon !== a.tournamentsWon) {
      return b.tournamentsWon - a.tournamentsWon
    }

    if (b.points !== a.points) {
      return b.points - a.points
    }

    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference
    }

    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor
    }

    return a.playerName.localeCompare(b.playerName, undefined, { sensitivity: 'base' })
  })
}

export function calculateHistoricalStats(
  input: CalculateHistoricalStatsInput,
): HistoricalStatsSnapshot {
  const playersById = new Map(input.players.map((player) => [player.id, player]))
  const tournamentsById = new Map(input.tournaments.map((tournament) => [tournament.id, tournament]))
  const stats = new Map<string, PlayerHistoricalStats>()

  function ensurePlayer(playerId: string): PlayerHistoricalStats {
    if (!stats.has(playerId)) {
      const player = playersById.get(playerId) ?? createRemovedPlayer(playerId)
      stats.set(playerId, createEmptyStats(player))
    }

    return stats.get(playerId)!
  }

  for (const player of input.players) {
    ensurePlayer(player.id)
  }

  const tournamentsPlayedCounts = new Map<string, Set<string>>()

  for (const entry of input.tournamentPlayers) {
    ensurePlayer(entry.playerId)

    const tournaments = tournamentsPlayedCounts.get(entry.playerId) ?? new Set<string>()
    tournaments.add(entry.tournamentId)
    tournamentsPlayedCounts.set(entry.playerId, tournaments)
  }

  for (const [playerId, tournaments] of tournamentsPlayedCounts) {
    ensurePlayer(playerId).tournamentsPlayed = tournaments.size
  }

  const matchesByTournament = new Map<string, Match[]>()

  for (const match of input.matches) {
    const tournamentMatches = matchesByTournament.get(match.tournamentId) ?? []
    tournamentMatches.push(match)
    matchesByTournament.set(match.tournamentId, tournamentMatches)
  }

  for (const match of input.matches) {
    if (!isPlayedMatch(match)) {
      continue
    }

    const tournament = tournamentsById.get(match.tournamentId)

    if (!tournament) {
      continue
    }

    const homeGoals = match.homeGoals!
    const awayGoals = match.awayGoals!
    const home = ensurePlayer(match.homePlayerId)
    const away = ensurePlayer(match.awayPlayerId)

    home.matchesPlayed += 1
    away.matchesPlayed += 1
    home.goalsFor += homeGoals
    home.goalsAgainst += awayGoals
    away.goalsFor += awayGoals
    away.goalsAgainst += homeGoals

    if (homeGoals > awayGoals) {
      home.wins += 1
      away.losses += 1
      home.points += tournament.pointsWin
      away.points += tournament.pointsLoss
    } else if (homeGoals < awayGoals) {
      away.wins += 1
      home.losses += 1
      away.points += tournament.pointsWin
      home.points += tournament.pointsLoss
    } else {
      home.draws += 1
      away.draws += 1
      home.points += tournament.pointsDraw
      away.points += tournament.pointsDraw
    }
  }

  for (const [tournamentId, tournamentMatches] of matchesByTournament) {
    if (!isTournamentComplete(tournamentMatches)) {
      continue
    }

    const tournament = tournamentsById.get(tournamentId)

    if (!tournament) {
      continue
    }

    const tournamentPlayers = getPlayersForTournament(
      input.tournamentPlayers,
      tournamentMatches,
      playersById,
      tournamentId,
    )
    const standings = calculateStandings(tournamentPlayers, tournamentMatches, tournament)
    const winnerId = standings[0]?.playerId

    if (!winnerId) {
      continue
    }

    ensurePlayer(winnerId).tournamentsWon += 1
  }

  const players = sortHistoricalStats(
    [...stats.values()].map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
      winRate: row.matchesPlayed > 0 ? row.wins / row.matchesPlayed : 0,
    })),
  )

  return { players }
}
