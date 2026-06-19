import type { GroupStandings } from '@shared/types/standings'
import { useAppTranslation } from '@renderer/i18n/useLocale'

interface TvGroupStandingsPanelProps {
  groups: GroupStandings[]
}

export function TvGroupStandingsPanel({ groups }: TvGroupStandingsPanelProps) {
  const { t } = useAppTranslation()

  if (groups.length === 0) {
    return (
      <section className="tv-panel tv-panel--main">
        <h2 className="tv-panel__title">{t('tv.groupStandings')}</h2>
        <p className="tv-panel__empty">{t('tv.noGroupStandings')}</p>
      </section>
    )
  }

  return (
    <section className="tv-panel tv-panel--main">
      <h2 className="tv-panel__title">{t('tv.groupStandings')}</h2>

      <div className="tv-group-grid">
        {groups.map((group) => (
          <div key={group.groupId} className="tv-group-card">
            <h3 className="tv-group-card__title">{group.groupName}</h3>

            <div className="tv-table-wrap">
              <table className="tv-table tv-table--compact">
                <thead>
                  <tr>
                    <th>{t('common.table.position')}</th>
                    <th>{t('common.player')}</th>
                    <th>{t('common.table.pts')}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.standings.map((row, index) => (
                    <tr
                      key={row.playerId}
                      className={index === 0 ? 'tv-table__row--leader' : undefined}
                    >
                      <td>{index + 1}</td>
                      <td className="tv-table__player">{row.playerName}</td>
                      <td className="tv-table__points">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
