import { translate, type Locale, DEFAULT_LOCALE } from '@shared/i18n'

export const MIN_TOURNAMENT_GROUP_COUNT = 2
export const MIN_PLAYERS_PER_GROUP = 2

export function getGroupName(orderIndex: number, locale: Locale = DEFAULT_LOCALE): string {
  if (!Number.isInteger(orderIndex) || orderIndex < 1) {
    throw new Error('orderIndex must be a positive integer')
  }

  const letter = String.fromCharCode(64 + orderIndex)
  return translate('errors.groupName', locale, { letter })
}

export function distributePlayersSnake(playerIds: string[], groupCount: number): string[][] {
  const groups = Array.from({ length: groupCount }, () => [] as string[])

  for (let seedIndex = 0; seedIndex < playerIds.length; seedIndex += 1) {
    const round = Math.floor(seedIndex / groupCount)
    const positionInRound = seedIndex % groupCount
    const groupIndex =
      round % 2 === 0 ? positionInRound : groupCount - 1 - positionInRound

    groups[groupIndex]!.push(playerIds[seedIndex]!)
  }

  return groups
}

export function buildSnakeGroupAssignments(
  playerIds: string[],
  groupCount: number,
): Array<{ orderIndex: number; playerIds: string[] }> {
  const distributed = distributePlayersSnake(playerIds, groupCount)

  return distributed.map((groupPlayerIds, index) => ({
    orderIndex: index + 1,
    playerIds: groupPlayerIds,
  }))
}
