import { forwardRef } from 'react'
import { APP_NAME } from '@shared/constants'
import type { StandingRow } from '@shared/types/standings'

export const EXPORTABLE_STANDINGS_CARD_WIDTH = 680

export interface ExportableStandingsCardProps {
  tournamentName: string
  standings: StandingRow[]
  generatedAt?: Date
  className?: string
}

function formatGeneratedDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export const ExportableStandingsCard = forwardRef<HTMLElement, ExportableStandingsCardProps>(
  function ExportableStandingsCard(
    { tournamentName, standings, generatedAt = new Date(), className },
    ref,
  ) {
    const rootClassName = ['exportable-standings-card', className].filter(Boolean).join(' ')
    const formattedDate = formatGeneratedDate(generatedAt)
    const title = tournamentName.trim() || 'Tournament'

    return (
      <article
        ref={ref}
        className={rootClassName}
        aria-label={`${title} standings card`}
        style={{ width: EXPORTABLE_STANDINGS_CARD_WIDTH }}
      >
        <div className="exportable-standings-card__frame">
          <header className="exportable-standings-card__header">
            <span className="exportable-standings-card__app">{APP_NAME}</span>
            <h1 className="exportable-standings-card__title">{title}</h1>
            <time className="exportable-standings-card__date" dateTime={generatedAt.toISOString()}>
              {formattedDate}
            </time>
          </header>

          <div className="exportable-standings-card__body">
            <h2 className="exportable-standings-card__section-label">Standings</h2>

            {standings.length === 0 ? (
              <p className="exportable-standings-card__empty">No standings yet</p>
            ) : (
              <table className="exportable-standings-card__table">
                <thead>
                  <tr>
                    <th className="exportable-standings-card__pos-col">#</th>
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
                  {standings.map((row, index) => {
                    const position = index + 1
                    const isLeader = position === 1

                    return (
                      <tr
                        key={row.playerId}
                        className={
                          isLeader ? 'exportable-standings-card__row--leader' : undefined
                        }
                      >
                        <td className="exportable-standings-card__pos">{position}</td>
                        <td className="exportable-standings-card__player">{row.playerName}</td>
                        <td>{row.played}</td>
                        <td>{row.won}</td>
                        <td>{row.drawn}</td>
                        <td>{row.lost}</td>
                        <td>{row.goalsFor}</td>
                        <td>{row.goalsAgainst}</td>
                        <td>{row.goalDifference}</td>
                        <td className="exportable-standings-card__points">{row.points}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <footer className="exportable-standings-card__footer">
            <span className="exportable-standings-card__footer-brand">{APP_NAME}</span>
          </footer>
        </div>
      </article>
    )
  },
)
