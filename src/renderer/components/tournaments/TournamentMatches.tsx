import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import { getPlayerDisplayName } from '@shared/validation'
import {
  formatMatchResult,
  groupMatchesByRound,
  matchStatusLabel,
  type MatchRound,
} from '@renderer/utils/matches'

interface TournamentMatchesProps {
  matches: Match[]
  playersById: Map<string, Player>
  onSelectMatch: (match: Match) => void
}

export function TournamentMatches({ matches, playersById, onSelectMatch }: TournamentMatchesProps) {
  const rounds: MatchRound[] = groupMatchesByRound(matches)

  if (rounds.length === 0) {
    return null
  }

  return (
    <div className="card tournament-detail__matches">
      <h2 className="tournament-detail__section-title">Matches</h2>

      <div className="match-rounds">
        {rounds.map((round) => (
          <section key={round.roundNumber} className="match-round">
            <h3 className="match-round__title">Round {round.roundNumber}</h3>
            <ul className="match-round__list">
              {round.matches.map((match) => {
                const result = formatMatchResult(match)

                return (
                  <li key={match.id}>
                    <button
                      type="button"
                      className="match-card match-card--interactive"
                      onClick={() => onSelectMatch(match)}
                    >
                      <div className="match-card__teams">
                        <span className="match-card__team">
                          {getPlayerDisplayName(playersById, match.homePlayerId)}
                        </span>
                        <span className="match-card__versus">{result ?? 'vs'}</span>
                        <span className="match-card__team">
                          {getPlayerDisplayName(playersById, match.awayPlayerId)}
                        </span>
                      </div>
                      <div className="match-card__meta">
                        <span className={`status-badge status-badge--match-${match.status}`}>
                          {matchStatusLabel(match.status)}
                        </span>
                        <span className="match-card__action">
                          {match.status === 'played' ? 'Edit result' : 'Enter result'}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
