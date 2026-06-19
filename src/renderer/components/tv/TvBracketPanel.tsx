import type { BracketView, BracketViewMatch } from '@shared/types/bracket-view'
import { matchStatusLabel } from '@renderer/utils/matches'

interface TvBracketPanelProps {
  bracketView: BracketView | null
}

function getBracketMatchStatusLabel(status: BracketViewMatch['status']): string {
  if (status === 'pending') {
    return 'Pending'
  }

  return matchStatusLabel(status)
}

function TvBracketMatchCard({ match }: { match: BracketViewMatch }) {
  return (
    <div className="tv-bracket-match">
      <div className="tv-bracket-match__header">
        <span className="tv-bracket-match__label">Match {match.bracketPosition}</span>
        <span className={`tv-bracket-match__status tv-bracket-match__status--${match.status}`}>
          {getBracketMatchStatusLabel(match.status)}
        </span>
      </div>

      <div className="tv-bracket-match__participants">
        <div
          className={`tv-bracket-match__participant${match.home.isPending ? ' tv-bracket-match__participant--pending' : ''}`}
        >
          <span className="tv-bracket-match__name">{match.home.label}</span>
          <span className="tv-bracket-match__score">{match.home.score ?? '–'}</span>
        </div>
        <div
          className={`tv-bracket-match__participant${match.away.isPending ? ' tv-bracket-match__participant--pending' : ''}`}
        >
          <span className="tv-bracket-match__name">{match.away.label}</span>
          <span className="tv-bracket-match__score">{match.away.score ?? '–'}</span>
        </div>
      </div>
    </div>
  )
}

export function TvBracketPanel({ bracketView }: TvBracketPanelProps) {
  if (!bracketView || bracketView.rounds.length === 0) {
    return (
      <section className="tv-panel tv-panel--main">
        <h2 className="tv-panel__title">Bracket</h2>
        <p className="tv-panel__empty">The bracket has not been generated yet.</p>
      </section>
    )
  }

  return (
    <section className="tv-panel tv-panel--main">
      <h2 className="tv-panel__title">Bracket</h2>

      <div className="tv-bracket-rounds">
        {bracketView.rounds.map((round) => (
          <section key={round.round} className="tv-bracket-round">
            <h3 className="tv-bracket-round__title">{round.label}</h3>
            <div className="tv-bracket-round__matches">
              {round.matches.map((match) => (
                <TvBracketMatchCard key={match.bracketMatchId} match={match} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
