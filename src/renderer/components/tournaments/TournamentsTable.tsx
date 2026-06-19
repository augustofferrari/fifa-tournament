import { Link } from 'react-router-dom'
import type { Tournament, TournamentStatus } from '@shared/types/tournament'
import { useAppTranslation } from '@renderer/i18n/useLocale'

interface TournamentsTableProps {
  tournaments: Tournament[]
}

export function TournamentsTable({ tournaments }: TournamentsTableProps) {
  const { t } = useAppTranslation()

  return (
    <div className="table-wrap card">
      <table className="table">
        <thead>
          <tr>
            <th>{t('tournaments.table.name')}</th>
            <th>{t('tournaments.table.status')}</th>
            <th className="table__actions-col">{t('tournaments.table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {tournaments.map((tournament) => (
            <tr key={tournament.id}>
              <td className="table__primary">{tournament.name}</td>
              <td>
                <span className={`status-badge status-badge--${tournament.status}`}>
                  {t(`common.status.${tournament.status as TournamentStatus}`)}
                </span>
              </td>
              <td className="table__actions">
                <Link className="btn btn--ghost btn--sm" to={`/tournaments/${tournament.id}`}>
                  {t('tournaments.table.view')}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
