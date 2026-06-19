import type { PlayerStreakDisplay, PlayerStreaks } from '@shared/types/player-streaks'

interface PlayerStreakStatsProps {
  streaks: PlayerStreakDisplay
  className?: string
}

const STREAK_ITEMS = [
  { key: 'currentWinStreak', label: 'Current win streak' },
  { key: 'bestWinStreak', label: 'Best win streak' },
  { key: 'currentUnbeatenStreak', label: 'Current unbeaten streak' },
] as const

export function PlayerStreakStats({ streaks, className }: PlayerStreakStatsProps) {
  const rootClassName = ['player-streak-stats', className].filter(Boolean).join(' ')

  return (
    <dl className={rootClassName}>
      {STREAK_ITEMS.map((item) => (
        <div key={item.key} className="player-streak-stats__item">
          <dt className="player-streak-stats__label">{item.label}</dt>
          <dd className="player-streak-stats__value">{streaks[item.key]}</dd>
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
