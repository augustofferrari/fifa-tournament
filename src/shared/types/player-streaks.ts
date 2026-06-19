export interface PlayerStreaks {
  playerId: string
  currentWinStreak: number
  currentUnbeatenStreak: number
  currentLosingStreak: number
  bestWinStreak: number
  bestUnbeatenStreak: number
}

export type PlayerStreakDisplay = Pick<
  PlayerStreaks,
  'currentWinStreak' | 'bestWinStreak' | 'currentUnbeatenStreak'
>
