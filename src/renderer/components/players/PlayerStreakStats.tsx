import type { PlayerStreakDisplay, PlayerStreaks } from '@shared/types/player-streaks'
import { useAppTranslation } from '@renderer/i18n/useLocale'

interface PlayerStreakStatsProps {
  streaks: PlayerStreakDisplay
  className?: string
}

const STREAK_KEYS = ['currentWinStreak', 'bestWinStreak', 'currentUnbeatenStreak'] as const

export function PlayerStreakStats({ streaks, className }: PlayerStreakStatsProps) {
  const { t } = useAppTranslation()
  const rootClassName = ['player-streak-stats', className].filter(Boolean).join(' ')

  return (
    <dl className={rootClassName}>
      {STREAK_KEYS.map((key) => (
        <div key={key} className="player-streak-stats__item">
          <dt className="player-streak-stats__label">
            {t(`players.profile.streakLabels.${key}`)}
          </dt>
          <dd className="player-streak-stats__value">{streaks[key]}</dd>
        </div>
      ))}
    </dl>
  )
}

export function getEmptyPlayerStreakDisplay(): PlayerStreakDisplay {
  return {
    currentWinStreak: 0,
    bestWinStreak: 0,
    currentUnbeatenStreak: 0,
  }
}

export function toPlayerStreakDisplay(streaks: PlayerStreaks): PlayerStreakDisplay {
  return {
    currentWinStreak: streaks.currentWinStreak,
    bestWinStreak: streaks.bestWinStreak,
    currentUnbeatenStreak: streaks.currentUnbeatenStreak,
  }
}
