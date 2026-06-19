import { Link } from 'react-router-dom'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'
import type { PlayerStreaks } from '@shared/types/player-streaks'
import { getEmptyPlayerStreakDisplay, toPlayerStreakDisplay } from '@renderer/components/players/PlayerStreakStats'

interface HistoricalRankingTableProps {
  rows: PlayerHistoricalStats[]
  streaksByPlayerId: Map<string, PlayerStreaks>
}

function formatWinRate(winRate: number): string {
  if (winRate === 0) {
    return '0%'
  }

  return `${(winRate * 100).toFixed(1)}%`
}

function formatGoalDifference(goalDifference: number): string {
  if (goalDifference > 0) {
    return `+${goalDifference}`
  }

  return String(goalDifference)
}

function getTopRowClass(position: number): string | undefined {
  if (position === 1) {
    return 'ranking-table__row--top-1'
  }

  if (position === 2) {
    return 'ranking-table__row--top-2'
  }

  if (position === 3) {
    return 'ranking-table__row--top-3'
  }

  return undefined
}

export function HistoricalRankingTable({ rows, streaksByPlayerId }: HistoricalRankingTableProps) {
  return (
    <div className="table-wrap card table-wrap--scroll">
      <table className="table ranking-table">
        <thead>
          <tr>
            <th className="ranking-table__pos-col">#</th>
            <th>Player</th>
            <th>Tournaments</th>
            <th>Won</th>
            <th>Matches</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Pts</th>
            <th>Win rate</th>
            <th>Win str</th>
            <th>Best win</th>
            <th>Unbeaten</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const position = index + 1
            const topRowClass = getTopRowClass(position)
            const streaks = streaksByPlayerId.has(row.playerId)
              ? toPlayerStreakDisplay(streaksByPlayerId.get(row.playerId)!)
              : getEmptyPlayerStreakDisplay()

            return (
              <tr key={row.playerId} className={topRowClass}>
                <td className="ranking-table__pos">{position}</td>
                <td className="table__primary">
                  <Link className="table__link" to={`/players/${row.playerId}`}>
                    {row.playerName}
                  </Link>
                </td>
                <td>{row.tournamentsPlayed}</td>
                <td>{row.tournamentsWon}</td>
                <td>{row.matchesPlayed}</td>
                <td>{row.wins}</td>
                <td>{row.draws}</td>
                <td>{row.losses}</td>
                <td>{row.goalsFor}</td>
                <td>{row.goalsAgainst}</td>
                <td>{formatGoalDifference(row.goalDifference)}</td>
                <td>{row.points}</td>
                <td>{formatWinRate(row.winRate)}</td>
                <td>{streaks.currentWinStreak}</td>
                <td>{streaks.bestWinStreak}</td>
                <td>{streaks.currentUnbeatenStreak}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
