import { useEffect, useMemo, useState } from 'react'
import type {
  TournamentAwards,
  TournamentBiggestWinAward,
  TournamentPlayerAward,
} from '@shared/types/tournament-awards'
import type { TFunction } from 'i18next'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { displayPlayerName } from '@renderer/i18n/display-utils'

interface TournamentAwardsSectionProps {
  tournamentId: string
  refreshTrigger?: unknown
}

interface AwardCardConfig {
  key: string
  icon: string
  label: string
  value: string
}

function formatPlayerAward(award: TournamentPlayerAward | null, t: TFunction): string {
  return award ? displayPlayerName(award.playerName, t) : t('common.emDash')
}

function formatBiggestWin(award: TournamentBiggestWinAward | null, t: TFunction): string {
  if (!award) {
    return t('common.emDash')
  }

  return t('tournaments.awards.biggestWinFormat', {
    winner: displayPlayerName(award.winnerPlayerName, t),
    winnerGoals: award.winnerGoals,
    loserGoals: award.loserGoals,
    loser: displayPlayerName(award.loserPlayerName, t),
  })
}

function buildAwardCards(awards: TournamentAwards, t: TFunction): AwardCardConfig[] {
  return [
    {
      key: 'champion',
      icon: '🏆',
      label: t('tournaments.awards.champion'),
      value: formatPlayerAward(awards.champion, t),
    },
    {
      key: 'runnerUp',
      icon: '🥈',
      label: t('tournaments.awards.runnerUp'),
      value: formatPlayerAward(awards.runnerUp, t),
    },
    {
      key: 'topScorer',
      icon: '⚽',
      label: t('tournaments.awards.topScorer'),
      value: formatPlayerAward(awards.topScorer, t),
    },
    {
      key: 'bestDefense',
      icon: '🧤',
      label: t('tournaments.awards.bestDefense'),
      value: formatPlayerAward(awards.bestDefense, t),
    },
    {
      key: 'biggestWin',
      icon: '💥',
      label: t('tournaments.awards.biggestWin'),
      value: formatBiggestWin(awards.biggestWin, t),
    },
    {
      key: 'mostWins',
      icon: '🔥',
      label: t('tournaments.awards.mostWins'),
      value: formatPlayerAward(awards.mostWins, t),
    },
  ]
}

export function TournamentAwardsSection({
  tournamentId,
  refreshTrigger,
}: TournamentAwardsSectionProps) {
  const { t } = useAppTranslation()
  const [awards, setAwards] = useState<TournamentAwards | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadAwards() {
      setIsLoading(true)

      try {
        const data = await window.api.tournaments.getAwards(tournamentId)

        if (!cancelled) {
          setAwards(data)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadAwards()

    return () => {
      cancelled = true
    }
  }, [tournamentId, refreshTrigger])

  const cards = useMemo(
    () => (awards ? buildAwardCards(awards, t) : []),
    [awards, t],
  )

  if (isLoading && !awards) {
    return (
      <div className="card tournament-detail__awards">
        <h2 className="tournament-detail__section-title">{t('tournaments.awardsSection.title')}</h2>
        <p className="tournament-detail__empty">{t('tournaments.awardsSection.loadingAwards')}</p>
      </div>
    )
  }

  if (!awards?.champion) {
    return (
      <div className="card tournament-detail__awards">
        <h2 className="tournament-detail__section-title">{t('tournaments.awardsSection.title')}</h2>
        <p className="tournament-detail__empty">
          {t('tournaments.awardsSection.notEnoughMatchesForAwards')}
        </p>
      </div>
    )
  }

  return (
    <div className="card tournament-detail__awards">
      <h2 className="tournament-detail__section-title">{t('tournaments.awardsSection.title')}</h2>
      <div className="tournament-awards__grid">
        {cards.map((card) => (
          <article key={card.key} className="tournament-award-card">
            <span className="tournament-award-card__icon" aria-hidden>
              {card.icon}
            </span>
            <h3 className="tournament-award-card__label">{card.label}</h3>
            <p className="tournament-award-card__value">{card.value}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
