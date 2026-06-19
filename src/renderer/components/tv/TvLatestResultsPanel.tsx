import type { LatestMatchResult } from '@shared/types/latest-match-result'

interface TvLatestResultsPanelProps {
  results: LatestMatchResult[]
}

export function TvLatestResultsPanel({ results }: TvLatestResultsPanelProps) {
  return (
    <section className="tv-panel tv-panel--side">
      <h2 className="tv-panel__title">Latest Results</h2>

      {results.length === 0 ? (
        <p className="tv-panel__empty">No played matches yet.</p>
      ) : (
        <ul className="tv-results-list">
          {results.map((result) => (
            <li key={result.matchId} className="tv-results-list__item">
              <div className="tv-results-list__meta">Round {result.roundNumber}</div>
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
