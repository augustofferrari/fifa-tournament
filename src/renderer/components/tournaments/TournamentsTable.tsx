import { Link } from 'react-router-dom'
import type { Tournament, TournamentStatus } from '@shared/types/tournament'

interface TournamentsTableProps {
  tournaments: Tournament[]
}

function statusLabel(status: TournamentStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function TournamentsTable({ tournaments }: TournamentsTableProps) {
  return (
    <div className="table-wrap card">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th className="table__actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tournaments.map((tournament) => (
            <tr key={tournament.id}>
              <td className="table__primary">{tournament.name}</td>
              <td>
                <span className={`status-badge status-badge--${tournament.status}`}>
                  {statusLabel(tournament.status)}
                </span>
              </td>
              <td className="table__actions">
                <Link className="btn btn--ghost btn--sm" to={`/tournaments/${tournament.id}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
