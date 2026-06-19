import { useEffect, useState } from 'react'
import type { GroupStandings } from '@shared/types/standings'

interface GroupStandingsTableProps {
  tournamentId: string
  refreshTrigger?: unknown
}

export function GroupStandingsTable({ tournamentId, refreshTrigger }: GroupStandingsTableProps) {
  const [groups, setGroups] = useState<GroupStandings[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadGroupStandings() {
      setIsLoading(true)

      try {
        const data = await window.api.tournaments.getGroupStandings(tournamentId)

        if (!cancelled) {
          setGroups(data)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadGroupStandings()

    return () => {
      cancelled = true
    }
  }, [tournamentId, refreshTrigger])

  if (isLoading && groups.length === 0) {
    return (
      <div className="card tournament-detail__standings">
        <h2 className="tournament-detail__section-title">Group Standings</h2>
        <p className="tournament-detail__empty">Loading group standings…</p>
      </div>
    )
  }

  if (groups.length === 0) {
    return null
  }

  return (
    <div className="card tournament-detail__standings">
      <h2 className="tournament-detail__section-title">Group Standings</h2>

      <div className="group-standings">
        {groups.map((group) => (
          <section key={group.groupId} className="group-standings__group">
            <h3 className="group-standings__title">{group.groupName}</h3>

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
                  {group.standings.map((row, index) => {
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
          </section>
        ))}
      </div>
    </div>
  )
}
