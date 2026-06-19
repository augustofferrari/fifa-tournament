import type { Tournament } from '@shared/types/tournament'
import type { TournamentPhase } from '@shared/types/tournament-phase'
import { isMatchResultsReadOnly } from '@shared/validation'
import { getPhaseTabLabel } from '@shared/tournament/phase-display.utils'
import { useAppTranslation } from '@renderer/i18n/useLocale'

interface TournamentPhaseTabsProps {
  phases: TournamentPhase[]
  selectedPhaseId: string
  onSelectPhase: (phaseId: string) => void
}

export function TournamentPhaseTabs({
  phases,
  selectedPhaseId,
  onSelectPhase,
}: TournamentPhaseTabsProps) {
  const { t, locale } = useAppTranslation()

  if (phases.length === 0) {
    return null
  }

  return (
    <div className="tournament-phase-tabs" role="tablist" aria-label={t('common.aria.tournamentPhases')}>
      {phases.map((phase) => {
        const isSelected = phase.id === selectedPhaseId
        const isActive = phase.status === 'active'

        return (
          <button
            key={phase.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`tournament-phase-tabs__tab${isSelected ? ' tournament-phase-tabs__tab--selected' : ''}${isActive ? ' tournament-phase-tabs__tab--active' : ''}`}
            onClick={() => onSelectPhase(phase.id)}
          >
            <span className="tournament-phase-tabs__label">
              {getPhaseTabLabel(phase.phaseType, locale)}
            </span>
            <span
              className={`tournament-phase-tabs__status tournament-phase-tabs__status--${phase.status}`}
            >
              {t(`common.status.${phase.status}`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function isPhaseReadOnly(
  tournament: Pick<Tournament, 'status' | 'resultsUnlocked'>,
  phase: TournamentPhase,
): boolean {
  return isMatchResultsReadOnly(tournament, phase)
}

export { isPhaseReadOnly }
