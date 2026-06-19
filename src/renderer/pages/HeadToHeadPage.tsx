import { useCallback, useEffect, useMemo, useState } from 'react'
import type { HeadToHeadStats } from '@shared/types/head-to-head'
import type { Player } from '@shared/types/player'
import { PageHeader } from '@renderer/components/PageHeader'
import { HeadToHeadMatchList, HeadToHeadSummary } from '@renderer/components/head-to-head'
import { displayPlayerName } from '@renderer/i18n/display-utils'
import { getErrorMessage } from '@renderer/i18n/ipc-error'
import { useAppTranslation } from '@renderer/i18n/useLocale'

export function HeadToHeadPage() {
  const { t } = useAppTranslation()
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

  const playerAName = playersById.get(playerAId)?.name ?? t('headToHead.fallbackPlayerA')
  const playerBName = playersById.get(playerBId)?.name ?? t('headToHead.fallbackPlayerB')

  const canCompare = playerAId !== '' && playerBId !== '' && playerAId !== playerBId
  const samePlayerSelected = playerAId !== '' && playerAId === playerBId

  const loadPlayers = useCallback(async () => {
    setError(null)

    try {
      const data = await window.api.players.list()
      setPlayers(data)
    } catch (err) {
      setError(getErrorMessage(err, t))
    } finally {
      setIsLoadingPlayers(false)
    }
  }, [t])

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
      setError(getErrorMessage(err, t))
    } finally {
      setIsLoadingStats(false)
    }
  }, [canCompare, playerAId, playerBId, t])

  useEffect(() => {
    void loadPlayers()
  }, [loadPlayers])

  useEffect(() => {
    if (samePlayerSelected) {
      setStats(null)
      setError(t('headToHead.selectTwoDifferent'))
      return
    }

    void loadHeadToHead()
  }, [loadHeadToHead, samePlayerSelected, t])

  const showEmptyState =
    canCompare && !isLoadingStats && !error && stats !== null && stats.totalMatches === 0

  const showResults = canCompare && !isLoadingStats && !error && stats !== null && stats.totalMatches > 0

  return (
    <section className="page page--wide">
      <PageHeader title={t('headToHead.title')} description={t('headToHead.description')} />

      <div className="head-to-head__selectors card">
        <label className="field">
          <span className="field__label">{t('headToHead.playerA')}</span>
          <select
            className="field__input"
            value={playerAId}
            onChange={(event) => setPlayerAId(event.target.value)}
            disabled={isLoadingPlayers || players.length === 0}
          >
            <option value="">{t('headToHead.selectPlayerA')}</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
                {player.teamName ? ` (${player.teamName})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">{t('headToHead.playerB')}</span>
          <select
            className="field__input"
            value={playerBId}
            onChange={(event) => setPlayerBId(event.target.value)}
            disabled={isLoadingPlayers || players.length === 0}
          >
            <option value="">{t('headToHead.selectPlayerB')}</option>
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
        <div className="page__empty">{t('headToHead.loadingPlayers')}</div>
      ) : players.length < 2 ? (
        <div className="page__empty">{t('headToHead.needTwoPlayers')}</div>
      ) : !playerAId || !playerBId ? (
        <div className="page__empty">{t('headToHead.selectTwoPlayers')}</div>
      ) : isLoadingStats ? (
        <div className="page__empty">{t('headToHead.loadingStats')}</div>
      ) : showEmptyState ? (
        <div className="page__empty">
          {t('headToHead.noMatches', {
            playerA: displayPlayerName(playerAName, t),
            playerB: displayPlayerName(playerBName, t),
          })}
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
