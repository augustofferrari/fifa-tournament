import type { BracketView, BracketViewMatch } from '@shared/types/bracket-view'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { matchStatusLabel } from '@renderer/utils/matches'

interface TvBracketPanelProps {
  bracketView: BracketView | null
}

function TvBracketMatchCard({ match }: { match: BracketViewMatch }) {
  const { t } = useAppTranslation()

  return (
    <div className="tv-bracket-match">
      <div className="tv-bracket-match__header">
        <span className="tv-bracket-match__label">
          {t('tv.match', { number: match.bracketPosition })}
        </span>
        <span className={`tv-bracket-match__status tv-bracket-match__status--${match.status}`}>
          {matchStatusLabel(match.status, t)}
        </span>
      </div>

      <div className="tv-bracket-match__participants">
        <div
          className={`tv-bracket-match__participant${match.home.isPending ? ' tv-bracket-match__participant--pending' : ''}`}
        >
          <span className="tv-bracket-match__name">{match.home.label}</span>
          <span className="tv-bracket-match__score">{match.home.score ?? t('common.emDash')}</span>
        </div>
        <div
          className={`tv-bracket-match__participant${match.away.isPending ? ' tv-bracket-match__participant--pending' : ''}`}
        >
          <span className="tv-bracket-match__name">{match.away.label}</span>
          <span className="tv-bracket-match__score">{match.away.score ?? t('common.emDash')}</span>
        </div>
      </div>
    </div>
  )
}

export function TvBracketPanel({ bracketView }: TvBracketPanelProps) {
  const { t } = useAppTranslation()

  if (!bracketView || bracketView.rounds.length === 0) {
    return (
      <section className="tv-panel tv-panel--main">
        <h2 className="tv-panel__title">{t('tv.bracket')}</h2>
        <p className="tv-panel__empty">{t('tv.bracketNotGenerated')}</p>
      </section>
    )
  }

  return (
    <section className="tv-panel tv-panel--main">
      <h2 className="tv-panel__title">{t('tv.bracket')}</h2>

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
