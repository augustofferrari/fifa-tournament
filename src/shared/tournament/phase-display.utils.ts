import { translate, type Locale } from '@shared/i18n'
import { TournamentPhaseType } from '@shared/types/tournament-phase'

const PHASE_LABEL_KEYS: Record<TournamentPhaseType, string> = {
  [TournamentPhaseType.ROUND_ROBIN]: 'tournaments.phase.roundRobin',
  [TournamentPhaseType.GROUP_STAGE]: 'tournaments.phase.groupStage',
  [TournamentPhaseType.PLAYOFF]: 'tournaments.phase.playoffs',
  [TournamentPhaseType.KNOCKOUT]: 'tournaments.phase.knockout',
}

export function getPhaseTabLabel(phaseType: TournamentPhaseType, locale: Locale = 'es'): string {
  return translate(PHASE_LABEL_KEYS[phaseType], locale)
}
