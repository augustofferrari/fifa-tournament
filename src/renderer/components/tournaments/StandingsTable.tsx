import { useEffect, useState } from 'react'
import type { StandingRow } from '@shared/types/standings'

interface StandingsTableProps {
  tournamentId: string
  phaseId?: string
  title?: string
  refreshTrigger?: unknown
}

export function StandingsTable({
  tournamentId,
  phaseId,
  title = 'Standings',
  refreshTrigger,
}: StandingsTableProps) {
  const [rows, setRows] = useState<StandingRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadStandings() {
      setIsLoading(true)

      try {
        const data = await window.api.tournaments.getStandings(tournamentId, phaseId)

        if (!cancelled) {
          setRows(data)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadStandings()

    return () => {
      cancelled = true
    }
  }, [tournamentId, phaseId, refreshTrigger])

  if (isLoading && rows.length === 0) {
    return (
      <div className="card tournament-detail__standings">
        <h2 className="tournament-detail__section-title">{title}</h2>
        <p className="tournament-detail__empty">Loading standings…</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="card tournament-detail__standings">
      <h2 className="tournament-detail__section-title">{title}</h2>

      <div className="table-wrap">
        <table className="table standings-table">
          <thead>
            <tr>
              <th className="standings-table__pos-col">#</th>
              <th>Player</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const position = index + 1
              const isLeader = position === 1

              return (
                <tr
                  key={row.playerId}
                  className={isLeader ? 'standings-table__row--leader' : undefined}
                >
                  <td className="standings-table__pos">{position}</td>
                  <td className="table__primary">{row.playerName}</td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.drawn}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td>{row.goalDifference}</td>
                  <td>{row.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
