import { getDatabase } from '@database'
import { KnockoutGenerationService } from './knockout-generation.service'
import { KnockoutOnlyGenerationService } from './knockout-only-generation.service'

let knockoutGenerationService: KnockoutGenerationService | undefined
let knockoutOnlyGenerationService: KnockoutOnlyGenerationService | undefined

export function getKnockoutGenerationService(): KnockoutGenerationService {
  if (!knockoutGenerationService) {
    knockoutGenerationService = new KnockoutGenerationService(getDatabase())
  }

  return knockoutGenerationService
}

export function getKnockoutOnlyGenerationService(): KnockoutOnlyGenerationService {
  if (!knockoutOnlyGenerationService) {
    knockoutOnlyGenerationService = new KnockoutOnlyGenerationService(getDatabase())
  }

  return knockoutOnlyGenerationService
}
