import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import { getPlayerDisplayName } from '@shared/validation'
import {
  formatMatchResult,
  groupMatchesByRound,
  type MatchRound,
} from '@renderer/utils/matches'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { displayPlayerName } from '@renderer/i18n/display-utils'

interface TournamentMatchesProps {
  matches: Match[]
  playersById: Map<string, Player>
  onSelectMatch: (match: Match) => void
  readOnly?: boolean
}

export function TournamentMatches({
  matches,
  playersById,
  onSelectMatch,
  readOnly = false,
}: TournamentMatchesProps) {
  const { t } = useAppTranslation()
  const rounds: MatchRound[] = groupMatchesByRound(matches)

  if (rounds.length === 0) {
    return null
  }

  return (
    <div className="card tournament-detail__matches">
      <h2 className="tournament-detail__section-title">{t('tournaments.matches')}</h2>

      <div className="match-rounds">
        {rounds.map((round) => (
          <section key={round.roundNumber} className="match-round">
            <h3 className="match-round__title">
              {t('common.round', { number: round.roundNumber })}
            </h3>
            <ul className="match-round__list">
              {round.matches.map((match) => {
                const result = formatMatchResult(match)

                return (
                  <li key={match.id}>
                    {readOnly ? (
                      <div className="match-card match-card--readonly">
                        <div className="match-card__teams">
                          <span className="match-card__team">
                            {displayPlayerName(
                              getPlayerDisplayName(playersById, match.homePlayerId),
                              t,
                            )}
                          </span>
                          <span className="match-card__versus">{result ?? t('common.vs')}</span>
                          <span className="match-card__team">
                            {displayPlayerName(
                              getPlayerDisplayName(playersById, match.awayPlayerId),
                              t,
                            )}
                          </span>
                        </div>
                        <div className="match-card__meta">
                          <span className={`status-badge status-badge--match-${match.status}`}>
                            {t(`common.status.${match.status}`)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="match-card match-card--interactive"
                        onClick={() => onSelectMatch(match)}
                      >
                        <div className="match-card__teams">
                          <span className="match-card__team">
                            {displayPlayerName(
                              getPlayerDisplayName(playersById, match.homePlayerId),
                              t,
                            )}
                          </span>
                          <span className="match-card__versus">{result ?? t('common.vs')}</span>
                          <span className="match-card__team">
                            {displayPlayerName(
                              getPlayerDisplayName(playersById, match.awayPlayerId),
                              t,
                            )}
                          </span>
                        </div>
                        <div className="match-card__meta">
                          <span className={`status-badge status-badge--match-${match.status}`}>
                            {t(`common.status.${match.status}`)}
                          </span>
                          <span className="match-card__action">
                            {match.status === 'played'
                              ? t('tournaments.match.editResult')
                              : t('tournaments.match.enterResult')}
                          </span>
                        </div>
                      </button>
                    )}
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
