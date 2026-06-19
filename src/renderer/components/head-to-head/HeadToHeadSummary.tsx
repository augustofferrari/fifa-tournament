import type { HeadToHeadStats } from '@shared/types/head-to-head'
import { displayPlayerName } from '@renderer/i18n/display-utils'
import { useAppTranslation } from '@renderer/i18n/useLocale'

interface HeadToHeadSummaryProps {
  stats: HeadToHeadStats
  playerAName: string
  playerBName: string
}

export function HeadToHeadSummary({ stats, playerAName, playerBName }: HeadToHeadSummaryProps) {
  const { t } = useAppTranslation()
  const displayAName = displayPlayerName(playerAName, t)
  const displayBName = displayPlayerName(playerBName, t)

  return (
    <div className="page__grid head-to-head__summary">
      <article className="card">
        <h2 className="card__title">{t('headToHead.summary.totalMatches')}</h2>
        <p className="card__value">{stats.totalMatches}</p>
      </article>
      <article className="card">
        <h2 className="card__title">{t('headToHead.summary.playerAWins', { name: displayAName })}</h2>
        <p className="card__value">{stats.playerAWins}</p>
      </article>
      <article className="card">
        <h2 className="card__title">{t('headToHead.summary.draws')}</h2>
        <p className="card__value">{stats.draws}</p>
      </article>
      <article className="card">
        <h2 className="card__title">{t('headToHead.summary.playerBWins', { name: displayBName })}</h2>
        <p className="card__value">{stats.playerBWins}</p>
      </article>
      <article className="card head-to-head__goals-card">
        <h2 className="card__title">{t('headToHead.summary.goals')}</h2>
        <p className="head-to-head__goals">
          <span>{displayAName}</span>
          <strong>{stats.playerAGoals}</strong>
          <span className="head-to-head__goals-sep">–</span>
          <strong>{stats.playerBGoals}</strong>
          <span>{displayBName}</span>
        </p>
      </article>
    </div>
  )
}
