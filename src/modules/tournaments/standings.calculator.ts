import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import type { StandingRow } from '@shared/types/standings'

function createEmptyStanding(player: Player): StandingRow {
  return {
    playerId: player.id,
    playerName: player.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }
}

export function calculateStandings(
  players: Player[],
  matches: Match[],
  tournament: Tournament,
): StandingRow[] {
  const standings = new Map(players.map((player) => [player.id, createEmptyStanding(player)]))

  for (const match of matches) {
    if (
      match.status !== 'played' ||
      match.homeGoals === null ||
      match.awayGoals === null
    ) {
      continue
    }

    const home = standings.get(match.homePlayerId)
    const away = standings.get(match.awayPlayerId)

    if (!home || !away) {
      continue
    }

    home.played += 1
    away.played += 1
    home.goalsFor += match.homeGoals
    home.goalsAgainst += match.awayGoals
    away.goalsFor += match.awayGoals
    away.goalsAgainst += match.homeGoals

    if (match.homeGoals > match.awayGoals) {
      home.won += 1
      away.lost += 1
      home.points += tournament.pointsWin
      away.points += tournament.pointsLoss
    } else if (match.homeGoals < match.awayGoals) {
      away.won += 1
      home.lost += 1
      away.points += tournament.pointsWin
      home.points += tournament.pointsLoss
    } else {
      home.drawn += 1
      away.drawn += 1
      home.points += tournament.pointsDraw
      away.points += tournament.pointsDraw
    }
  }

  return [...standings.values()]
    .map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
    }))
    .sort((a, b) => {
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
