import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '@shared/ipc/errors'
import type { Player } from '@shared/types/player'
import { PageHeader } from '@renderer/components/PageHeader'
import {
  formValuesToInput,
  PlayerForm,
  playerToFormValues,
  PlayersTable,
  type PlayerFormValues,
} from '@renderer/components/players'

type FormMode = 'closed' | 'create' | 'edit'

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

export function PlayersPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<FormMode>('closed')
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadPlayers = useCallback(async () => {
    setError(null)

    try {
      const data = await window.api.players.list()
      setPlayers(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPlayers()
  }, [loadPlayers])

  useEffect(() => {
    const state = location.state as { openCreate?: boolean } | null

    if (!state?.openCreate) {
      return
    }

    setEditingPlayer(null)
    setFormMode('create')
    setError(null)
    navigate('.', { replace: true, state: null })
  }, [location.state, navigate])

  function openCreateForm() {
    setEditingPlayer(null)
    setFormMode('create')
    setError(null)
  }

  function openEditForm(player: Player) {
    setEditingPlayer(player)
    setFormMode('edit')
    setError(null)
  }

  function closeForm() {
    setFormMode('closed')
    setEditingPlayer(null)
  }

  async function handleSubmit(values: PlayerFormValues) {
    setIsSaving(true)
    setError(null)

    try {
      if (formMode === 'create') {
        await window.api.players.create(formValuesToInput(values))
      } else if (editingPlayer) {
        await window.api.players.update(editingPlayer.id, formValuesToInput(values))
      }

      closeForm()
      await loadPlayers()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(player: Player) {
    const confirmed = window.confirm(`Delete ${player.name}? This cannot be undone.`)

    if (!confirmed) {
      return
    }

    setError(null)

    try {
      await window.api.players.delete(player.id)
      await loadPlayers()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <section className="page page--wide">
      <PageHeader
        title="Players"
        description="Manage player profiles and sticker assignments."
      />

      <div className="page-toolbar">
        <button className="btn btn--primary" type="button" onClick={openCreateForm}>
          Add Player
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {formMode !== 'closed' && (
        <PlayerForm
          key={formMode === 'edit' ? editingPlayer?.id : 'create'}
          mode={formMode}
          initialValues={editingPlayer ? playerToFormValues(editingPlayer) : undefined}
          isSubmitting={isSaving}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}

      {isLoading ? (
        <div className="page__empty">Loading players…</div>
      ) : players.length === 0 ? (
        <div className="page__empty">No players yet. Add your first player to get started.</div>
      ) : (
        <PlayersTable players={players} onEdit={openEditForm} onDelete={handleDelete} />
      )}
    </section>
  )
}
