import { Link } from 'react-router-dom'
import type { Player } from '@shared/types/player'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { PlayerPhoto } from './PlayerPhoto'

interface PlayersTableProps {
  players: Player[]
  onEdit: (player: Player) => void
  onDelete: (player: Player) => void
}

export function PlayersTable({ players, onEdit, onDelete }: PlayersTableProps) {
  const { t } = useAppTranslation()

  return (
    <div className="table-wrap card">
      <table className="table">
        <thead>
          <tr>
            <th className="table__photo-col">{t('players.table.photo')}</th>
            <th>{t('players.table.name')}</th>
            <th>{t('players.table.nickname')}</th>
            <th>{t('players.table.team')}</th>
            <th className="table__actions-col">{t('players.table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td>
                <PlayerPhoto photoPath={player.photoPath} alt={player.name} size="sm" />
              </td>
              <td className="table__primary">
                <Link className="table__link" to={`/players/${player.id}`}>
                  {player.name}
                </Link>
              </td>
              <td>{player.nickname ?? t('common.none')}</td>
              <td>{player.teamName ?? t('common.none')}</td>
              <td className="table__actions">
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => onEdit(player)}>
                  {t('players.table.edit')}
                </button>
                <button
                  className="btn btn--ghost btn--sm btn--danger"
                  type="button"
                  onClick={() => onDelete(player)}
                >
                  {t('players.table.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
