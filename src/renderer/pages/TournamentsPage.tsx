import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Player } from '@shared/types/player'
import type { CreateTournamentInput, Tournament } from '@shared/types/tournament'
import { PageHeader } from '@renderer/components/PageHeader'
import { TournamentCreateWizard, TournamentsTable } from '@renderer/components/tournaments'
import { getErrorMessage } from '@renderer/i18n/ipc-error'
import { useAppTranslation } from '@renderer/i18n/useLocale'

export function TournamentsPage() {
  const { t } = useAppTranslation()
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
      setError(getErrorMessage(err, t))
    } finally {
      setIsLoading(false)
    }
  }, [t])

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

  async function handleCreate(input: CreateTournamentInput, playerIds: string[]) {
    setIsSaving(true)
    setError(null)

    try {
      const tournament = await window.api.tournaments.create(input)
      await window.api.tournaments.addPlayers(tournament.id, playerIds)

      setShowCreateForm(false)
      navigate(`/tournaments/${tournament.id}`)
    } catch (err) {
      setError(getErrorMessage(err, t))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page page--wide">
      <PageHeader title={t('tournaments.title')} description={t('tournaments.description')} />

      <div className="page-toolbar">
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => {
            setShowCreateForm(true)
            setError(null)
          }}
        >
          {t('tournaments.createTournament')}
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {showCreateForm && (
        <TournamentCreateWizard
          players={players}
          isSubmitting={isSaving}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {isLoading ? (
        <div className="page__empty">{t('tournaments.loading')}</div>
      ) : tournaments.length === 0 ? (
        <div className="page__empty">{t('tournaments.empty')}</div>
      ) : (
        <TournamentsTable tournaments={tournaments} />
      )}
    </section>
  )
}
