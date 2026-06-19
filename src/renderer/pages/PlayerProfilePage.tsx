import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '@shared/ipc/errors'
import type { PlayerHistoricalStats } from '@shared/types/historical-stats'
import type { Player } from '@shared/types/player'
import type { PlayerStreaks } from '@shared/types/player-streaks'
import { PlayerPhoto } from '@renderer/components/players/PlayerPhoto'
import {
  getEmptyPlayerStreakDisplay,
  PlayerStreakStats,
  toPlayerStreakDisplay,
} from '@renderer/components/players/PlayerStreakStats'

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

function formatWinRate(winRate: number): string {
  if (winRate === 0) {
    return '0%'
  }

  return `${(winRate * 100).toFixed(1)}%`
}

function formatGoalDifference(goalDifference: number): string {
  if (goalDifference > 0) {
    return `+${goalDifference}`
  }

  return String(goalDifference)
}

export function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [player, setPlayer] = useState<Player | null>(null)
  const [historicalStats, setHistoricalStats] = useState<PlayerHistoricalStats | null>(null)
  const [streaks, setStreaks] = useState<PlayerStreaks | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    if (!id) {
      setError('Player not found')
      setIsLoading(false)
      return
    }

    setError(null)

    try {
      const [playerData, ranking, streakData] = await Promise.all([
        window.api.players.getById(id),
        window.api.stats.getHistoricalRanking(),
        window.api.stats.getPlayerStreaks(id),
      ])

      if (!playerData) {
        setError('Player not found')
        return
      }

      setPlayer(playerData)
      setHistoricalStats(ranking.find((row) => row.playerId === id) ?? null)
      setStreaks(streakData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const streakDisplay = useMemo(
    () => (streaks ? toPlayerStreakDisplay(streaks) : getEmptyPlayerStreakDisplay()),
    [streaks],
  )

  if (isLoading) {
    return (
      <section className="page page--wide">
        <div className="page__empty">Loading player profile…</div>
      </section>
    )
  }

  if (error && !player) {
    return (
      <section className="page page--wide">
        <Link className="btn btn--ghost" to="/players">
          Back to Players
        </Link>
        <div className="alert alert--error">{error ?? 'Player not found'}</div>
      </section>
    )
  }

  if (!player) {
    return (
      <section className="page page--wide">
        <Link className="btn btn--ghost" to="/players">
          Back to Players
        </Link>
        <div className="alert alert--error">Player not found</div>
      </section>
    )
  }

  return (
    <section className="page page--wide">
      <div className="page-toolbar page-toolbar--start">
        <Link className="btn btn--ghost" to="/players">
          Back to Players
        </Link>
        <Link className="btn btn--ghost" to="/ranking">
          Historical Ranking
        </Link>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <header className="player-profile__header card">
        <PlayerPhoto photoPath={player.photoPath} alt={player.name} size="lg" />
        <div className="player-profile__identity">
          <h1 className="player-profile__name">{player.name}</h1>
          {player.nickname && <p className="player-profile__nickname">{player.nickname}</p>}
          {player.teamName && <p className="player-profile__team">{player.teamName}</p>}
        </div>
      </header>

      <div className="player-profile__grid">
        <section className="card player-profile__section">
          <h2 className="player-profile__section-title">Streaks</h2>
          <PlayerStreakStats streaks={streakDisplay} />
        </section>

        <section className="card player-profile__section">
          <h2 className="player-profile__section-title">Historical stats</h2>
          {historicalStats && historicalStats.matchesPlayed > 0 ? (
            <dl className="player-profile__stats">
              <div className="player-profile__stat">
                <dt>Tournaments</dt>
                <dd>{historicalStats.tournamentsPlayed}</dd>
              </div>
              <div className="player-profile__stat">
                <dt>Titles won</dt>
                <dd>{historicalStats.tournamentsWon}</dd>
              </div>
              <div className="player-profile__stat">
                <dt>Matches</dt>
                <dd>{historicalStats.matchesPlayed}</dd>
              </div>
              <div className="player-profile__stat">
                <dt>Record</dt>
                <dd>
                  {historicalStats.wins}W-{historicalStats.draws}D-{historicalStats.losses}L
                </dd>
              </div>
              <div className="player-profile__stat">
                <dt>Goals</dt>
                <dd>{historicalStats.goalsFor}</dd>
              </div>
              <div className="player-profile__stat">
                <dt>Goals against</dt>
                <dd>{historicalStats.goalsAgainst}</dd>
              </div>
              <div className="player-profile__stat">
                <dt>Goal difference</dt>
                <dd>{formatGoalDifference(historicalStats.goalDifference)}</dd>
              </div>
              <div className="player-profile__stat">
                <dt>Points</dt>
                <dd>{historicalStats.points}</dd>
              </div>
              <div className="player-profile__stat">
                <dt>Win rate</dt>
                <dd>{formatWinRate(historicalStats.winRate)}</dd>
              </div>
            </dl>
          ) : (
            <p className="player-profile__empty">No played matches yet.</p>
          )}
        </section>
      </div>
    </section>
  )
}
