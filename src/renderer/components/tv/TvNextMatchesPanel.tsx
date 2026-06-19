import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { getMatchPlayerLabel } from './tv-mode.utils'

interface TvNextMatchesPanelProps {
  matches: Match[]
  playersById: Map<string, Player>
}

export function TvNextMatchesPanel({ matches, playersById }: TvNextMatchesPanelProps) {
  const { t } = useAppTranslation()

  return (
    <section className="tv-panel tv-panel--side">
      <h2 className="tv-panel__title">{t('tv.nextMatches')}</h2>

      {matches.length === 0 ? (
        <p className="tv-panel__empty">{t('tv.noUpcomingMatches')}</p>
      ) : (
        <ul className="tv-next-list">
          {matches.map((match) => (
            <li key={match.id} className="tv-next-list__item">
              <div className="tv-next-list__meta">{t('tv.round', { number: match.roundNumber })}</div>
              <div className="tv-next-list__match">
                <span className="tv-next-list__player">
                  {getMatchPlayerLabel(playersById, match.homePlayerId)}
                </span>
                <span className="tv-next-list__versus">{t('common.vs')}</span>
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
