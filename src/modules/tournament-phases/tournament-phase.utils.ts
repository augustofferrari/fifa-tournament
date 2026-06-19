import { TournamentFormat } from '@shared/types/tournament-format'
import {
  TournamentPhaseType,
  type TournamentPhaseStatus,
} from '@shared/types/tournament-phase'

export interface PlannedTournamentPhase {
  phaseType: TournamentPhaseType
  name: string
  orderIndex: number
  status: TournamentPhaseStatus
}

export function getPhasePlanForFormat(format: TournamentFormat): PlannedTournamentPhase[] {
  switch (format) {
    case TournamentFormat.ROUND_ROBIN:
      return [
        {
          phaseType: TournamentPhaseType.ROUND_ROBIN,
          name: 'Regular Season',
          orderIndex: 1,
          status: 'active',
        },
      ]
    case TournamentFormat.ROUND_ROBIN_PLAYOFFS:
      return [
        {
          phaseType: TournamentPhaseType.ROUND_ROBIN,
          name: 'Regular Season',
          orderIndex: 1,
          status: 'active',
        },
        {
          phaseType: TournamentPhaseType.PLAYOFF,
          name: 'Playoffs',
          orderIndex: 2,
          status: 'pending',
        },
      ]
    case TournamentFormat.GROUPS_KNOCKOUT:
      return [
        {
          phaseType: TournamentPhaseType.GROUP_STAGE,
          name: 'Group Stage',
          orderIndex: 1,
          status: 'active',
        },
        {
          phaseType: TournamentPhaseType.KNOCKOUT,
          name: 'Knockout',
          orderIndex: 2,
          status: 'pending',
        },
      ]
    case TournamentFormat.KNOCKOUT_ONLY:
      return [
        {
          phaseType: TournamentPhaseType.KNOCKOUT,
          name: 'Knockout',
          orderIndex: 1,
          status: 'active',
        },
      ]
  }
}

export function getInitialPhaseTypeForFormat(format: TournamentFormat): TournamentPhaseType {
  return getPhasePlanForFormat(format)[0]!.phaseType
}

export function getInitialPhaseName(phaseType: TournamentPhaseType): string {
  switch (phaseType) {
    case TournamentPhaseType.GROUP_STAGE:
      return 'Group Stage'
    case TournamentPhaseType.PLAYOFF:
      return 'Playoffs'
    case TournamentPhaseType.KNOCKOUT:
      return 'Knockout'
    case TournamentPhaseType.ROUND_ROBIN:
    default:
      return 'Regular Season'
  }
}
