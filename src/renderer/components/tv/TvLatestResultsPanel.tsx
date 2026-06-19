import type { LatestMatchResult } from '@shared/types/latest-match-result'
import { useAppTranslation } from '@renderer/i18n/useLocale'

interface TvLatestResultsPanelProps {
  results: LatestMatchResult[]
}

export function TvLatestResultsPanel({ results }: TvLatestResultsPanelProps) {
  const { t } = useAppTranslation()

  return (
    <section className="tv-panel tv-panel--side">
      <h2 className="tv-panel__title">{t('tv.latestResults')}</h2>

      {results.length === 0 ? (
        <p className="tv-panel__empty">{t('tv.noPlayedMatches')}</p>
      ) : (
        <ul className="tv-results-list">
          {results.map((result) => (
            <li key={result.matchId} className="tv-results-list__item">
              <div className="tv-results-list__meta">{t('tv.round', { number: result.roundNumber })}</div>
              <div className="tv-results-list__match">
                <span className="tv-results-list__player">{result.homePlayerName}</span>
                <strong className="tv-results-list__score">
                  {result.homeGoals} – {result.awayGoals}
                </strong>
                <span className="tv-results-list__player">{result.awayPlayerName}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
