import { PlayerStreakService } from './player-streaks.service'

let playerStreakService: PlayerStreakService | null = null

export function getPlayerStreakService(): PlayerStreakService {
  if (!playerStreakService) {
    playerStreakService = new PlayerStreakService()
  }

  return playerStreakService
}
