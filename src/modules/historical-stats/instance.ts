import { HistoricalStatsRepository } from './historical-stats.repository'

let historicalStatsRepository: HistoricalStatsRepository | null = null

export function getHistoricalStatsRepository(): HistoricalStatsRepository {
  if (!historicalStatsRepository) {
    historicalStatsRepository = new HistoricalStatsRepository()
  }

  return historicalStatsRepository
}
