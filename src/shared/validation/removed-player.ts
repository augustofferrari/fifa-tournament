import type { Player } from '@shared/types/player'
import { ValidationMessages } from './messages'

export function createRemovedPlayer(playerId: string): Player {
  return {
    id: playerId,
    name: ValidationMessages.removedPlayer,
    nickname: null,
    teamName: null,
    photoPath: null,
    createdAt: '',
    updatedAt: '',
  }
}

export function getPlayerDisplayName(
  playersById: Map<string, Player>,
  playerId: string,
): string {
  return playersById.get(playerId)?.name ?? ValidationMessages.removedPlayer
}
