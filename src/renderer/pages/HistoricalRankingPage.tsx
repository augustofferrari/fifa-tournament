import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'
import type { PlayerStreaks } from '@shared/types/player-streaks'
import { PageHeader } from '@renderer/components/PageHeader'
import { HistoricalRankingTable } from '@renderer/components/ranking'
import { getErrorMessage } from '@renderer/i18n/ipc-error'
import { useAppTranslation } from '@renderer/i18n/useLocale'

function hasPlayedMatches(rows: PlayerHistoricalStats[]): boolean {
  return rows.some((row) => row.matchesPlayed > 0)
}

export function HistoricalRankingPage() {
  const { t } = useAppTranslation()
  const [ranking, setRanking] = useState<PlayerHistoricalStats[]>([])
  const [streaks, setStreaks] = useState<PlayerStreaks[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const streaksByPlayerId = useMemo(
    () => new Map(streaks.map((entry) => [entry.playerId, entry])),
    [streaks],
  )

  const loadRanking = useCallback(async () => {
    setError(null)

    try {
      const [rankingData, streakData] = await Promise.all([
        window.api.stats.getHistoricalRanking(),
        window.api.stats.getAllPlayerStreaks(),
      ])
      setRanking(rankingData)
      setStreaks(streakData)
    } catch (err) {
      setError(getErrorMessage(err, t))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadRanking()
  }, [loadRanking])

  const showEmptyState = !isLoading && !error && !hasPlayedMatches(ranking)

  return (
    <section className="page page--wide">
      <PageHeader title={t('ranking.title')} description={t('ranking.description')} />

      {error && <div className="alert alert--error">{error}</div>}

      {isLoading ? (
        <div className="page__empty">{t('ranking.loading')}</div>
      ) : showEmptyState ? (
        <div className="page__empty">{t('ranking.empty')}</div>
      ) : (
        <HistoricalRankingTable rows={ranking} streaksByPlayerId={streaksByPlayerId} />
      )}
    </section>
  )
}
