import { Link } from 'react-router-dom'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'
import type { PlayerStreaks } from '@shared/types/player-streaks'
import { getEmptyPlayerStreakDisplay, toPlayerStreakDisplay } from '@renderer/components/players/PlayerStreakStats'
import { displayPlayerName } from '@renderer/i18n/display-utils'
import { useAppTranslation } from '@renderer/i18n/useLocale'

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
  const { t } = useAppTranslation()

  return (
    <div className="table-wrap card table-wrap--scroll">
      <table className="table ranking-table">
        <thead>
          <tr>
            <th className="ranking-table__pos-col">{t('common.table.position')}</th>
            <th>{t('ranking.table.player')}</th>
            <th>{t('ranking.table.tournaments')}</th>
            <th>{t('ranking.table.won')}</th>
            <th>{t('ranking.table.matches')}</th>
            <th>{t('common.table.w')}</th>
            <th>{t('common.table.d')}</th>
            <th>{t('common.table.l')}</th>
            <th>{t('common.table.gf')}</th>
            <th>{t('common.table.ga')}</th>
            <th>{t('common.table.gd')}</th>
            <th>{t('common.table.pts')}</th>
            <th>{t('ranking.table.winRate')}</th>
            <th>{t('ranking.table.winStr')}</th>
            <th>{t('ranking.table.bestWin')}</th>
            <th>{t('ranking.table.unbeaten')}</th>
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
                    {displayPlayerName(row.playerName, t)}
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
