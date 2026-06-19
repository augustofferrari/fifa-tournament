import type { StandingRow } from '@shared/types/standings'
import { useAppTranslation } from '@renderer/i18n/useLocale'

interface TvStandingsPanelProps {
  rows: StandingRow[]
  title?: string
}

export function TvStandingsPanel({ rows, title }: TvStandingsPanelProps) {
  const { t } = useAppTranslation()
  const panelTitle = title ?? t('tv.standings')

  if (rows.length === 0) {
    return (
      <section className="tv-panel tv-panel--main">
        <h2 className="tv-panel__title">{panelTitle}</h2>
        <p className="tv-panel__empty">{t('tv.noStandings')}</p>
      </section>
    )
  }

  return (
    <section className="tv-panel tv-panel--main">
      <h2 className="tv-panel__title">{panelTitle}</h2>

      <div className="tv-table-wrap">
        <table className="tv-table">
          <thead>
            <tr>
              <th>{t('common.table.position')}</th>
              <th>{t('common.player')}</th>
              <th>{t('common.table.p')}</th>
              <th>{t('common.table.w')}</th>
              <th>{t('common.table.d')}</th>
              <th>{t('common.table.l')}</th>
              <th>{t('common.table.gf')}</th>
              <th>{t('common.table.ga')}</th>
              <th>{t('common.table.gd')}</th>
              <th>{t('common.table.pts')}</th>
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
