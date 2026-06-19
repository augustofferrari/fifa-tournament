import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import { getMatchPlayerLabel } from './tv-mode.utils'

interface TvNextMatchesPanelProps {
  matches: Match[]
  playersById: Map<string, Player>
}

export function TvNextMatchesPanel({ matches, playersById }: TvNextMatchesPanelProps) {
  return (
    <section className="tv-panel tv-panel--side">
      <h2 className="tv-panel__title">Next Matches</h2>

      {matches.length === 0 ? (
        <p className="tv-panel__empty">No upcoming matches in this phase.</p>
      ) : (
        <ul className="tv-next-list">
          {matches.map((match) => (
            <li key={match.id} className="tv-next-list__item">
              <div className="tv-next-list__meta">Round {match.roundNumber}</div>
              <div className="tv-next-list__match">
                <span className="tv-next-list__player">
                  {getMatchPlayerLabel(playersById, match.homePlayerId)}
                </span>
                <span className="tv-next-list__versus">vs</span>
                <span className="tv-next-list__player">
                  {getMatchPlayerLabel(playersById, match.awayPlayerId)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
