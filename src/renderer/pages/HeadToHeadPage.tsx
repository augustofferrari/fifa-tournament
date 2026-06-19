import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@shared/ipc/errors'
import type { HeadToHeadStats } from '@shared/types/head-to-head'
import type { Player } from '@shared/types/player'
import { PageHeader } from '@renderer/components/PageHeader'
import { HeadToHeadMatchList, HeadToHeadSummary } from '@renderer/components/head-to-head'

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

export function HeadToHeadPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [playerAId, setPlayerAId] = useState('')
  const [playerBId, setPlayerBId] = useState('')
  const [stats, setStats] = useState<HeadToHeadStats | null>(null)
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  )

  const playerAName = playersById.get(playerAId)?.name ?? 'Player A'
  const playerBName = playersById.get(playerBId)?.name ?? 'Player B'

  const canCompare = playerAId !== '' && playerBId !== '' && playerAId !== playerBId
  const samePlayerSelected = playerAId !== '' && playerAId === playerBId

  const loadPlayers = useCallback(async () => {
    setError(null)

    try {
      const data = await window.api.players.list()
      setPlayers(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoadingPlayers(false)
    }
  }, [])

  const loadHeadToHead = useCallback(async () => {
    if (!canCompare) {
      setStats(null)
      return
    }

    setIsLoadingStats(true)
    setError(null)

    try {
      const data = await window.api.stats.getHeadToHead(playerAId, playerBId)
      setStats(data)
    } catch (err) {
      setStats(null)
      setError(getErrorMessage(err))
    } finally {
      setIsLoadingStats(false)
    }
  }, [canCompare, playerAId, playerBId])

  useEffect(() => {
    void loadPlayers()
  }, [loadPlayers])

  useEffect(() => {
    if (samePlayerSelected) {
      setStats(null)
      setError('Select two different players to compare.')
      return
    }

    void loadHeadToHead()
  }, [loadHeadToHead, samePlayerSelected])

  const showEmptyState =
    canCompare && !isLoadingStats && !error && stats !== null && stats.totalMatches === 0

  const showResults = canCompare && !isLoadingStats && !error && stats !== null && stats.totalMatches > 0

  return (
    <section className="page page--wide">
      <PageHeader
        title="Head to Head"
        description="Compare two players across every match they played against each other."
      />

      <div className="head-to-head__selectors card">
        <label className="field">
          <span className="field__label">Player A</span>
          <select
            className="field__input"
            value={playerAId}
            onChange={(event) => setPlayerAId(event.target.value)}
            disabled={isLoadingPlayers || players.length === 0}
          >
            <option value="">Select player A…</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
                {player.teamName ? ` (${player.teamName})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Player B</span>
          <select
            className="field__input"
            value={playerBId}
            onChange={(event) => setPlayerBId(event.target.value)}
            disabled={isLoadingPlayers || players.length === 0}
          >
            <option value="">Select player B…</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
                {player.teamName ? ` (${player.teamName})` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {isLoadingPlayers ? (
        <div className="page__empty">Loading players…</div>
      ) : players.length < 2 ? (
        <div className="page__empty">
          Add at least two players to compare head-to-head stats.
        </div>
      ) : !playerAId || !playerBId ? (
        <div className="page__empty">Select two players to see their head-to-head record.</div>
      ) : isLoadingStats ? (
        <div className="page__empty">Loading head-to-head stats…</div>
      ) : showEmptyState ? (
        <div className="page__empty">
          {playerAName} and {playerBName} have not played each other yet.
        </div>
      ) : showResults && stats ? (
        <>
          <HeadToHeadSummary stats={stats} playerAName={playerAName} playerBName={playerBName} />
          <HeadToHeadMatchList
            matches={stats.lastMatches}
            playerAId={playerAId}
            playerBId={playerBId}
            playerAName={playerAName}
            playerBName={playerBName}
          />
        </>
      ) : null}
    </section>
  )
}
