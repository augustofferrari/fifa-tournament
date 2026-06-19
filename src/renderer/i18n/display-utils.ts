import type { TFunction } from 'i18next'
import { ValidationMessages } from '@shared/validation/messages'

export function displayPlayerName(name: string, t: TFunction): string {
  if (name === ValidationMessages.removedPlayer) {
    return t(ValidationMessages.removedPlayer)
  }

  return name
}
