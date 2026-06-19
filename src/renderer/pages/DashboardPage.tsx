import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@shared/ipc/errors'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'
import type { LatestMatchResult } from '@shared/types/latest-match-result'
import type { Tournament } from '@shared/types/tournament'
import { PageHeader } from '@renderer/components/PageHeader'
import { LatestResultsWidget } from '@renderer/components/dashboard'

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

function hasPlayedMatches(rows: PlayerHistoricalStats[]): boolean {
  return rows.some((row) => row.matchesPlayed > 0)
}

function countPlayedMatches(rows: PlayerHistoricalStats[]): number {
  const totalPlayerMatches = rows.reduce((sum, row) => sum + row.matchesPlayed, 0)
  return totalPlayerMatches / 2
}

export function DashboardPage() {
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
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  return (
    <section className="page">
      <PageHeader
        title="Dashboard"
        description="Overview of your players, tournaments, and quick shortcuts."
      />

      {error && <div className="alert alert--error">{error}</div>}

      {isLoading ? (
        <div className="page__empty">Loading dashboard…</div>
      ) : (
        <>
          <div className="page__grid dashboard__stats">
            <Link className="card card--link" to="/players">
              <h2 className="card__title">Total players</h2>
              <p className="card__value">{playerCount}</p>
            </Link>

            <Link className="card card--link" to="/tournaments">
              <h2 className="card__title">Total tournaments</h2>
              <p className="card__value">{tournamentCount}</p>
            </Link>

            <Link className="card card--link" to="/tournaments">
              <h2 className="card__title">Active tournaments</h2>
              <p className="card__value">{activeTournamentCount}</p>
            </Link>

            <article className="card">
              <h2 className="card__title">Total played matches</h2>
              <p className="card__value">{playedMatchCount}</p>
            </article>

            {historicalLeader ? (
              <Link className="card card--link" to="/ranking">
                <h2 className="card__title">Historical leader</h2>
                <p className="card__value dashboard__leader-name">{historicalLeader.playerName}</p>
                <p className="card__meta">{historicalLeader.points} pts</p>
              </Link>
            ) : (
              <article className="card">
                <h2 className="card__title">Historical leader</h2>
                <p className="card__value">—</p>
                <p className="card__meta">No played matches yet</p>
              </article>
            )}
          </div>

          <LatestResultsWidget results={latestResults} />

          <section className="dashboard__section card">
            <h2 className="dashboard__section-title">Quick links</h2>
            <div className="page__grid dashboard__links">
              <Link className="card card--link dashboard__link-card" to="/ranking">
                <h3 className="dashboard__link-title">Ranking</h3>
                <p className="dashboard__link-desc">All-time player stats across every tournament</p>
              </Link>

              <Link className="card card--link dashboard__link-card" to="/head-to-head">
                <h3 className="dashboard__link-title">Head to Head</h3>
                <p className="dashboard__link-desc">Compare records between any two players</p>
              </Link>

              {latestTournament ? (
                <Link
                  className="card card--link dashboard__link-card"
                  to={`/tournaments/${latestTournament.id}`}
                >
                  <h3 className="dashboard__link-title">Latest Tournament</h3>
                  <p className="dashboard__link-desc">{latestTournament.name}</p>
                  <span className={`status-badge status-badge--${latestTournament.status}`}>
                    {latestTournament.status}
                  </span>
                </Link>
              ) : (
                <article className="card dashboard__link-card dashboard__link-card--empty">
                  <h3 className="dashboard__link-title">Latest Tournament</h3>
                  <p className="dashboard__link-desc">Create a tournament to get started</p>
                </article>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  )
}
