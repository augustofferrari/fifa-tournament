import { HeadToHeadStatsService } from './head-to-head-stats.service'

let headToHeadStatsService: HeadToHeadStatsService | null = null

export function getHeadToHeadStatsService(): HeadToHeadStatsService {
  if (!headToHeadStatsService) {
    headToHeadStatsService = new HeadToHeadStatsService()
  }

  return headToHeadStatsService
}
