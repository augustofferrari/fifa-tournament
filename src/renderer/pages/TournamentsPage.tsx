import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '@shared/ipc/errors'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import { PageHeader } from '@renderer/components/PageHeader'
import { TournamentCreateForm, TournamentsTable } from '@renderer/components/tournaments'

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

export function TournamentsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = useCallback(async () => {
    setError(null)

    try {
      const [tournamentList, playerList] = await Promise.all([
        window.api.tournaments.list(),
        window.api.players.list(),
      ])

      setTournaments(tournamentList)
      setPlayers(playerList)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    const state = location.state as { openCreate?: boolean } | null

    if (!state?.openCreate) {
      return
    }

    setShowCreateForm(true)
    setError(null)
    navigate('.', { replace: true, state: null })
  }, [location.state, navigate])

  async function handleCreate(name: string, playerIds: string[]) {
    setIsSaving(true)
    setError(null)

    try {
      const tournament = await window.api.tournaments.create({ name })
      await window.api.tournaments.addPlayers(tournament.id, playerIds)

      setShowCreateForm(false)
      navigate(`/tournaments/${tournament.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page page--wide">
      <PageHeader
        title="Tournaments"
        description="Track tournaments and competition progress."
      />

      <div className="page-toolbar">
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => {
            setShowCreateForm(true)
            setError(null)
          }}
        >
          Create Tournament
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {showCreateForm && (
        <TournamentCreateForm
          players={players}
          isSubmitting={isSaving}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {isLoading ? (
        <div className="page__empty">Loading tournaments…</div>
      ) : tournaments.length === 0 ? (
        <div className="page__empty">
          No tournaments yet. Create your first tournament to get started.
        </div>
      ) : (
        <TournamentsTable tournaments={tournaments} />
      )}
    </section>
  )
}
