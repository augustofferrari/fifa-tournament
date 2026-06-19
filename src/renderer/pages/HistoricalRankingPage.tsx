import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@shared/ipc/errors'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'
import type { PlayerStreaks } from '@shared/types/player-streaks'
import { PageHeader } from '@renderer/components/PageHeader'
import { HistoricalRankingTable } from '@renderer/components/ranking'

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

export function HistoricalRankingPage() {
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
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRanking()
  }, [loadRanking])

  const showEmptyState = !isLoading && !error && !hasPlayedMatches(ranking)

  return (
    <section className="page page--wide">
      <PageHeader
        title="Historical Ranking"
        description="All-time player stats across every completed match."
      />

      {error && <div className="alert alert--error">{error}</div>}

      {isLoading ? (
        <div className="page__empty">Loading historical ranking…</div>
      ) : showEmptyState ? (
        <div className="page__empty">
          No played matches yet. Record match results in a tournament to build the ranking.
        </div>
      ) : (
        <HistoricalRankingTable rows={ranking} streaksByPlayerId={streaksByPlayerId} />
      )}
    </section>
  )
}
