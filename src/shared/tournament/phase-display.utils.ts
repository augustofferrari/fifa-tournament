import { TournamentPhaseType } from '@shared/types/tournament-phase'

export function getPhaseTabLabel(phaseType: TournamentPhaseType): string {
  switch (phaseType) {
    case TournamentPhaseType.ROUND_ROBIN:
      return 'Round Robin'
    case TournamentPhaseType.GROUP_STAGE:
      return 'Group Stage'
    case TournamentPhaseType.PLAYOFF:
      return 'Playoffs'
    case TournamentPhaseType.KNOCKOUT:
      return 'Knockout'
  }
}
