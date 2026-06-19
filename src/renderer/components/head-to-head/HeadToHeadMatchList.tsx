import type { TFunction } from 'i18next'
import type { HeadToHeadLastMatch } from '@shared/types/head-to-head'
import { displayPlayerName } from '@renderer/i18n/display-utils'
import { useAppTranslation } from '@renderer/i18n/useLocale'

interface HeadToHeadMatchListProps {
  matches: HeadToHeadLastMatch[]
  playerAId: string
  playerBId: string
  playerAName: string
  playerBName: string
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getResultLabel(
  match: HeadToHeadLastMatch,
  playerAId: string,
  playerBId: string,
  playerAName: string,
  playerBName: string,
  t: TFunction,
): string {
  if (match.winnerPlayerId === null) {
    return t('headToHead.result.draw')
  }

  if (match.winnerPlayerId === playerAId) {
    return t('headToHead.result.won', { name: displayPlayerName(playerAName, t) })
  }

  if (match.winnerPlayerId === playerBId) {
    return t('headToHead.result.won', { name: displayPlayerName(playerBName, t) })
  }

  return t('headToHead.result.played')
}

export function HeadToHeadMatchList({
  matches,
  playerAId,
  playerBId,
  playerAName,
  playerBName,
}: HeadToHeadMatchListProps) {
  const { t } = useAppTranslation()
  const displayAName = displayPlayerName(playerAName, t)
  const displayBName = displayPlayerName(playerBName, t)

  return (
    <section className="card head-to-head__matches">
      <h2 className="head-to-head__section-title">{t('headToHead.recentMatches')}</h2>
      <ul className="head-to-head__match-list">
        {matches.map((match, index) => (
          <li key={`${match.date}-${match.roundNumber}-${index}`} className="head-to-head__match">
            <div className="head-to-head__match-main">
              <span className="head-to-head__match-tournament">{match.tournamentName}</span>
              <span className="head-to-head__match-meta">
                {t('common.roundMeta', {
                  round: match.roundNumber,
                  date: formatDate(match.date),
                })}
              </span>
            </div>
            <div className="head-to-head__match-score">
              <span>{displayAName}</span>
              <strong>
                {match.playerAGoals} – {match.playerBGoals}
              </strong>
              <span>{displayBName}</span>
            </div>
            <span className="head-to-head__match-result">
              {getResultLabel(match, playerAId, playerBId, playerAName, playerBName, t)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
