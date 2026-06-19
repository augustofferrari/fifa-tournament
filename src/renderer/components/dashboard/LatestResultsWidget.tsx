import { Link } from 'react-router-dom'
import type { LatestMatchResult } from '@shared/types/latest-match-result'
import { displayPlayerName } from '@renderer/i18n/display-utils'
import { useAppTranslation } from '@renderer/i18n/useLocale'

interface LatestResultsWidgetProps {
  results: LatestMatchResult[]
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function LatestResultsWidget({ results }: LatestResultsWidgetProps) {
  const { t } = useAppTranslation()

  return (
    <section className="dashboard__section card">
      <h2 className="dashboard__section-title">{t('dashboard.latestResults.title')}</h2>

      {results.length === 0 ? (
        <p className="dashboard__empty-state">{t('dashboard.latestResults.empty')}</p>
      ) : (
        <ul className="dashboard-latest-results">
          {results.map((result) => (
            <li key={result.matchId} className="dashboard-latest-results__item">
              <div className="dashboard-latest-results__main">
                <Link
                  className="dashboard-latest-results__tournament"
                  to={`/tournaments/${result.tournamentId}`}
                >
                  {result.tournamentName}
                </Link>
                <span className="dashboard-latest-results__date">
                  {formatDate(result.playedAt)}
                </span>
              </div>

              <div className="dashboard-latest-results__score">
                <span className="dashboard-latest-results__player">
                  {displayPlayerName(result.homePlayerName, t)}
                </span>
                <strong className="dashboard-latest-results__result">
                  {result.homeGoals} – {result.awayGoals}
                </strong>
                <span className="dashboard-latest-results__player">
                  {displayPlayerName(result.awayPlayerName, t)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
