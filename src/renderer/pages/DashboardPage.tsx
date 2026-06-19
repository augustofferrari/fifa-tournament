import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'
import type { LatestMatchResult } from '@shared/types/latest-match-result'
import type { Tournament } from '@shared/types/tournament'
import { PageHeader } from '@renderer/components/PageHeader'
import { LatestResultsWidget } from '@renderer/components/dashboard'
import { displayPlayerName } from '@renderer/i18n/display-utils'
import { getErrorMessage } from '@renderer/i18n/ipc-error'
import { useAppTranslation } from '@renderer/i18n/useLocale'

function hasPlayedMatches(rows: PlayerHistoricalStats[]): boolean {
  return rows.some((row) => row.matchesPlayed > 0)
}

function countPlayedMatches(rows: PlayerHistoricalStats[]): number {
  const totalPlayerMatches = rows.reduce((sum, row) => sum + row.matchesPlayed, 0)
  return totalPlayerMatches / 2
}

export function DashboardPage() {
  const { t } = useAppTranslation()
  const [playerCount, setPlayerCount] = useState(0)
  const [tournamentCount, setTournamentCount] = useState(0)
  const [activeTournamentCount, setActiveTournamentCount] = useState(0)
  const [playedMatchCount, setPlayedMatchCount] = useState(0)
  const [historicalLeader, setHistoricalLeader] = useState<PlayerHistoricalStats | null>(null)
  const [latestTournament, setLatestTournament] = useState<Tournament | null>(null)
  const [latestResults, setLatestResults] = useState<LatestMatchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setError(null)

    try {
      const [players, tournaments, activeTournaments, ranking, results] = await Promise.all([
        window.api.players.list(),
        window.api.tournaments.list(),
        window.api.tournaments.list({ status: 'active' }),
        window.api.stats.getHistoricalRanking(),
        window.api.matches.getLatestResults(5),
      ])

      setPlayerCount(players.length)
      setTournamentCount(tournaments.length)
      setActiveTournamentCount(activeTournaments.length)
      setPlayedMatchCount(countPlayedMatches(ranking))
      setHistoricalLeader(hasPlayedMatches(ranking) ? (ranking[0] ?? null) : null)
      setLatestTournament(tournaments[0] ?? null)
      setLatestResults(results)
    } catch (err) {
      setError(getErrorMessage(err, t))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  return (
    <section className="page">
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

      {error && <div className="alert alert--error">{error}</div>}

      {isLoading ? (
        <div className="page__empty">{t('dashboard.loading')}</div>
      ) : (
        <>
          <div className="page__grid dashboard__stats">
            <Link className="card card--link" to="/players">
              <h2 className="card__title">{t('dashboard.stats.totalPlayers')}</h2>
              <p className="card__value">{playerCount}</p>
            </Link>

            <Link className="card card--link" to="/tournaments">
              <h2 className="card__title">{t('dashboard.stats.totalTournaments')}</h2>
              <p className="card__value">{tournamentCount}</p>
            </Link>

            <Link className="card card--link" to="/tournaments">
              <h2 className="card__title">{t('dashboard.stats.activeTournaments')}</h2>
              <p className="card__value">{activeTournamentCount}</p>
            </Link>

            <article className="card">
              <h2 className="card__title">{t('dashboard.stats.totalPlayedMatches')}</h2>
              <p className="card__value">{playedMatchCount}</p>
            </article>

            {historicalLeader ? (
              <Link className="card card--link" to="/ranking">
                <h2 className="card__title">{t('dashboard.stats.historicalLeader')}</h2>
                <p className="card__value dashboard__leader-name">
                  {displayPlayerName(historicalLeader.playerName, t)}
                </p>
                <p className="card__meta">
                  {historicalLeader.points} {t('common.pts')}
                </p>
              </Link>
            ) : (
              <article className="card">
                <h2 className="card__title">{t('dashboard.stats.historicalLeader')}</h2>
                <p className="card__value">{t('common.emDash')}</p>
                <p className="card__meta">{t('dashboard.stats.noPlayedMatchesYet')}</p>
              </article>
            )}
          </div>

          <LatestResultsWidget results={latestResults} />

          <section className="dashboard__section card">
            <h2 className="dashboard__section-title">{t('dashboard.quickLinks.title')}</h2>
            <div className="page__grid dashboard__links">
              <Link className="card card--link dashboard__link-card" to="/ranking">
                <h3 className="dashboard__link-title">{t('dashboard.quickLinks.ranking.title')}</h3>
                <p className="dashboard__link-desc">{t('dashboard.quickLinks.ranking.description')}</p>
              </Link>

              <Link className="card card--link dashboard__link-card" to="/head-to-head">
                <h3 className="dashboard__link-title">{t('dashboard.quickLinks.headToHead.title')}</h3>
                <p className="dashboard__link-desc">
                  {t('dashboard.quickLinks.headToHead.description')}
                </p>
              </Link>

              {latestTournament ? (
                <Link
                  className="card card--link dashboard__link-card"
                  to={`/tournaments/${latestTournament.id}`}
                >
                  <h3 className="dashboard__link-title">
                    {t('dashboard.quickLinks.latestTournament.title')}
                  </h3>
                  <p className="dashboard__link-desc">{latestTournament.name}</p>
                  <span className={`status-badge status-badge--${latestTournament.status}`}>
                    {t(`common.status.${latestTournament.status}`)}
                  </span>
                </Link>
              ) : (
                <article className="card dashboard__link-card dashboard__link-card--empty">
                  <h3 className="dashboard__link-title">
                    {t('dashboard.quickLinks.latestTournament.title')}
                  </h3>
                  <p className="dashboard__link-desc">
                    {t('dashboard.quickLinks.latestTournament.empty')}
                  </p>
                </article>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  )
}
