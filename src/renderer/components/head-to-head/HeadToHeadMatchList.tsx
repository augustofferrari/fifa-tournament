import type { HeadToHeadLastMatch } from '@shared/types/head-to-head'

interface HeadToHeadMatchListProps {
  matches: HeadToHeadLastMatch[]
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getResultLabel(
  match: HeadToHeadLastMatch,
  playerAId: string,
  playerBId: string,
  playerAName: string,
  playerBName: string,
): string {
  if (match.winnerPlayerId === null) {
    return 'Draw'
  }

  if (match.winnerPlayerId === playerAId) {
    return `${playerAName} won`
  }

  if (match.winnerPlayerId === playerBId) {
    return `${playerBName} won`
  }

  return 'Played'
}

export function HeadToHeadMatchList({
  matches,
  playerAId,
  playerBId,
  playerAName,
  playerBName,
}: HeadToHeadMatchListProps) {
  return (
    <section className="card head-to-head__matches">
      <h2 className="head-to-head__section-title">Recent matches</h2>
      <ul className="head-to-head__match-list">
        {matches.map((match, index) => (
          <li key={`${match.date}-${match.roundNumber}-${index}`} className="head-to-head__match">
            <div className="head-to-head__match-main">
              <span className="head-to-head__match-tournament">{match.tournamentName}</span>
              <span className="head-to-head__match-meta">
                Round {match.roundNumber} · {formatDate(match.date)}
              </span>
            </div>
            <div className="head-to-head__match-score">
              <span>{playerAName}</span>
              <strong>
                {match.playerAGoals} – {match.playerBGoals}
              </strong>
              <span>{playerBName}</span>
            </div>
            <span className="head-to-head__match-result">
              {getResultLabel(match, playerAId, playerBId, playerAName, playerBName)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
