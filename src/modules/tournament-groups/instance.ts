import { getDatabase } from '@database'
import { GroupGenerationService } from './group-generation.service'
import { GroupStageFixtureService } from './group-stage-fixture.service'
import { GroupStandingsService } from './group-standings.service'

let groupGenerationService: GroupGenerationService | undefined
let groupStageFixtureService: GroupStageFixtureService | undefined
let groupStandingsService: GroupStandingsService | undefined

export function getGroupGenerationService(): GroupGenerationService {
  if (!groupGenerationService) {
    groupGenerationService = new GroupGenerationService(getDatabase())
  }

  return groupGenerationService
}

export function getGroupStageFixtureService(): GroupStageFixtureService {
  if (!groupStageFixtureService) {
    groupStageFixtureService = new GroupStageFixtureService(getDatabase())
  }

  return groupStageFixtureService
}

export function getGroupStandingsService(): GroupStandingsService {
  if (!groupStandingsService) {
    groupStandingsService = new GroupStandingsService(getDatabase())
  }

  return groupStandingsService
}
