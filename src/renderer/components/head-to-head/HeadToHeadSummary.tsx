import type { HeadToHeadStats } from '@shared/types/head-to-head'

interface HeadToHeadSummaryProps {
  stats: HeadToHeadStats
  playerAName: string
  playerBName: string
}

export function HeadToHeadSummary({ stats, playerAName, playerBName }: HeadToHeadSummaryProps) {
  return (
    <div className="page__grid head-to-head__summary">
      <article className="card">
        <h2 className="card__title">Total matches</h2>
        <p className="card__value">{stats.totalMatches}</p>
      </article>
      <article className="card">
        <h2 className="card__title">{playerAName} wins</h2>
        <p className="card__value">{stats.playerAWins}</p>
      </article>
      <article className="card">
        <h2 className="card__title">Draws</h2>
        <p className="card__value">{stats.draws}</p>
      </article>
      <article className="card">
        <h2 className="card__title">{playerBName} wins</h2>
        <p className="card__value">{stats.playerBWins}</p>
      </article>
      <article className="card head-to-head__goals-card">
        <h2 className="card__title">Goals</h2>
        <p className="head-to-head__goals">
          <span>{playerAName}</span>
          <strong>{stats.playerAGoals}</strong>
          <span className="head-to-head__goals-sep">–</span>
          <strong>{stats.playerBGoals}</strong>
          <span>{playerBName}</span>
        </p>
      </article>
    </div>
  )
}
