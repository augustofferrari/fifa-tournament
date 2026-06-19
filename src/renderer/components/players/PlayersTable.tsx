import type { Player } from '@shared/types/player'
import { PlayerPhoto } from './PlayerPhoto'

interface PlayersTableProps {
  players: Player[]
  onEdit: (player: Player) => void
  onDelete: (player: Player) => void
}

export function PlayersTable({ players, onEdit, onDelete }: PlayersTableProps) {
  return (
    <div className="table-wrap card">
      <table className="table">
        <thead>
          <tr>
            <th className="table__photo-col">Photo</th>
            <th>Name</th>
            <th>Nickname</th>
            <th>Team</th>
            <th className="table__actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td>
                <PlayerPhoto photoPath={player.photoPath} alt={player.name} size="sm" />
              </td>
              <td className="table__primary">{player.name}</td>
              <td>{player.nickname ?? '—'}</td>
              <td>{player.teamName ?? '—'}</td>
              <td className="table__actions">
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => onEdit(player)}>
                  Edit
                </button>
                <button
                  className="btn btn--ghost btn--sm btn--danger"
                  type="button"
                  onClick={() => onDelete(player)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
