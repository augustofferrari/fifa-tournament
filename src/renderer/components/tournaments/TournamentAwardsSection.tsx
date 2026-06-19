import { useEffect, useState } from 'react'
import type {
  TournamentAwards,
  TournamentBiggestWinAward,
  TournamentPlayerAward,
} from '@shared/types/tournament-awards'

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

function formatPlayerAward(award: TournamentPlayerAward | null): string {
  return award?.playerName ?? '—'
}

function formatBiggestWin(award: TournamentBiggestWinAward | null): string {
  if (!award) {
    return '—'
  }

  return `${award.winnerPlayerName} ${award.winnerGoals}–${award.loserGoals} ${award.loserPlayerName}`
}

function buildAwardCards(awards: TournamentAwards): AwardCardConfig[] {
  return [
    {
      key: 'champion',
      icon: '🏆',
      label: 'Champion',
      value: formatPlayerAward(awards.champion),
    },
    {
      key: 'runnerUp',
      icon: '🥈',
      label: 'Runner-up',
      value: formatPlayerAward(awards.runnerUp),
    },
    {
      key: 'topScorer',
      icon: '⚽',
      label: 'Top scorer',
      value: formatPlayerAward(awards.topScorer),
    },
    {
      key: 'bestDefense',
      icon: '🧤',
      label: 'Best defense',
      value: formatPlayerAward(awards.bestDefense),
    },
    {
      key: 'biggestWin',
      icon: '💥',
      label: 'Biggest win',
      value: formatBiggestWin(awards.biggestWin),
    },
    {
      key: 'mostWins',
      icon: '🔥',
      label: 'Most wins',
      value: formatPlayerAward(awards.mostWins),
    },
  ]
}

export function TournamentAwardsSection({
  tournamentId,
  refreshTrigger,
}: TournamentAwardsSectionProps) {
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

  if (isLoading && !awards) {
    return (
      <div className="card tournament-detail__awards">
        <h2 className="tournament-detail__section-title">Awards</h2>
        <p className="tournament-detail__empty">Loading awards…</p>
      </div>
    )
  }

  if (!awards?.champion) {
    return (
      <div className="card tournament-detail__awards">
        <h2 className="tournament-detail__section-title">Awards</h2>
        <p className="tournament-detail__empty">Not enough matches played yet</p>
      </div>
    )
  }

  const cards = buildAwardCards(awards)

  return (
    <div className="card tournament-detail__awards">
      <h2 className="tournament-detail__section-title">Awards</h2>
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
