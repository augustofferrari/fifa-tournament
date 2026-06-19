import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@shared/ipc/errors'
import type { Tournament } from '@shared/types/tournament'
import { PageHeader } from '@renderer/components/PageHeader'

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [playerCount, setPlayerCount] = useState(0)
  const [tournamentCount, setTournamentCount] = useState(0)
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setError(null)

    try {
      const [players, tournaments, activeTournaments] = await Promise.all([
        window.api.players.list(),
        window.api.tournaments.list(),
        window.api.tournaments.list({ status: 'active' }),
      ])

      setPlayerCount(players.length)
      setTournamentCount(tournaments.length)
      setActiveTournament(activeTournaments[0] ?? null)
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
              <h2 className="card__title">Players</h2>
              <p className="card__value">{playerCount}</p>
            </Link>
            <Link className="card card--link" to="/tournaments">
              <h2 className="card__title">Tournaments</h2>
              <p className="card__value">{tournamentCount}</p>
            </Link>
          </div>

          <section className="dashboard__section card">
            <h2 className="dashboard__section-title">Active tournament</h2>
            {activeTournament ? (
              <div className="dashboard__active">
                <div>
                  <p className="dashboard__active-name">{activeTournament.name}</p>
                  <span className="status-badge status-badge--active">Active</span>
                </div>
                <Link
                  className="btn btn--ghost btn--sm"
                  to={`/tournaments/${activeTournament.id}`}
                >
                  View tournament
                </Link>
              </div>
            ) : (
              <p className="dashboard__empty">
                No active tournament. Create one and generate fixtures to start playing.
              </p>
            )}
          </section>

          <section className="dashboard__section card">
            <h2 className="dashboard__section-title">Quick actions</h2>
            <div className="page-toolbar page-toolbar--start dashboard__actions">
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => navigate('/players', { state: { openCreate: true } })}
              >
                Create Player
              </button>
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => navigate('/tournaments', { state: { openCreate: true } })}
              >
                Create Tournament
              </button>
              <Link className="btn btn--ghost" to="/stickers">
                Open Stickers Album
              </Link>
            </div>
          </section>
        </>
      )}
    </section>
  )
}
