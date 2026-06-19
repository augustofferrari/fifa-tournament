import {
  generateRoundRobinFixtures,
  type RoundRobinFixtureMatch,
} from '@modules/fixtures'

export interface GroupStageFixtureGroupInput {
  groupId: string
  playerIds: string[]
}

export interface GroupStageFixtureAssignment {
  groupId: string
  fixtures: RoundRobinFixtureMatch[]
}

export function generateGroupStageRoundRobinFixtures(
  groups: GroupStageFixtureGroupInput[],
): GroupStageFixtureAssignment[] {
  return groups.map(({ groupId, playerIds }) => ({
    groupId,
    fixtures: generateRoundRobinFixtures(playerIds),
  }))
}
