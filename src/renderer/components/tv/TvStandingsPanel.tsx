import type { StandingRow } from '@shared/types/standings'

interface TvStandingsPanelProps {
  rows: StandingRow[]
  title?: string
}

export function TvStandingsPanel({ rows, title = 'Standings' }: TvStandingsPanelProps) {
  if (rows.length === 0) {
    return (
      <section className="tv-panel tv-panel--main">
        <h2 className="tv-panel__title">{title}</h2>
        <p className="tv-panel__empty">No standings yet.</p>
      </section>
    )
  }

  return (
    <section className="tv-panel tv-panel--main">
      <h2 className="tv-panel__title">{title}</h2>

      <div className="tv-table-wrap">
        <table className="tv-table">
          <thead>
            <tr>
              <th>#</th>
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

              return (
                <tr
                  key={row.playerId}
                  className={position === 1 ? 'tv-table__row--leader' : undefined}
                >
                  <td>{position}</td>
                  <td className="tv-table__player">{row.playerName}</td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.drawn}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td>{row.goalDifference}</td>
                  <td className="tv-table__points">{row.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
