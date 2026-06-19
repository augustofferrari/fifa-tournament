import { getDatabase } from '@database'
import { BracketViewService } from './bracket-view.service'
import { PlayoffGenerationService } from './playoff-generation.service'

let playoffGenerationService: PlayoffGenerationService | undefined
let bracketViewService: BracketViewService | undefined

export function getPlayoffGenerationService(): PlayoffGenerationService {
  if (!playoffGenerationService) {
    playoffGenerationService = new PlayoffGenerationService(getDatabase())
  }

  return playoffGenerationService
}

export function getBracketViewService(): BracketViewService {
  if (!bracketViewService) {
    bracketViewService = new BracketViewService(getDatabase())
  }

  return bracketViewService
}
