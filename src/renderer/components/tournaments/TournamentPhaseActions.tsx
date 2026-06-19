import { useState } from 'react'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import type { TournamentPhase } from '@shared/types/tournament-phase'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { getErrorMessage } from '@renderer/i18n/ipc-error'
import {
  getGenerateKnockoutActionState,
  getGeneratePlayoffsActionState,
} from './tournament-phase-actions.utils'

interface TournamentPhaseActionsProps {
  tournament: Tournament
  phases: TournamentPhase[]
  selectedPhase: TournamentPhase | null
  matches: Match[]
  onRefresh: () => Promise<void>
  onPhaseChange: (phaseId: string) => void
  onError: (message: string | null) => void
}

export function TournamentPhaseActions({
  tournament,
  phases,
  selectedPhase,
  matches,
  onRefresh,
  onPhaseChange,
  onError,
}: TournamentPhaseActionsProps) {
  const { t } = useAppTranslation()
  const [isGeneratingPlayoffs, setIsGeneratingPlayoffs] = useState(false)
  const [isGeneratingKnockout, setIsGeneratingKnockout] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const playoffsAction = getGeneratePlayoffsActionState(
    tournament,
    phases,
    selectedPhase,
    matches,
    t,
  )
  const knockoutAction = getGenerateKnockoutActionState(
    tournament,
    phases,
    selectedPhase,
    matches,
    t,
  )

  if (!playoffsAction.visible && !knockoutAction.visible) {
    return null
  }

  async function handleGeneratePlayoffs() {
    if (!playoffsAction.enabled || !tournament.playoffQualifiedCount) {
      return
    }

    setIsGeneratingPlayoffs(true)
    setActionError(null)
    onError(null)

    try {
      const result = await window.api.tournaments.generatePlayoffs(
        tournament.id,
        tournament.playoffQualifiedCount,
      )
      await onRefresh()
      onPhaseChange(result.playoffPhaseId)
    } catch (error) {
      const message = getErrorMessage(error, t)
      setActionError(message)
      onError(message)
    } finally {
      setIsGeneratingPlayoffs(false)
    }
  }

  async function handleGenerateKnockout() {
    if (!knockoutAction.enabled || !tournament.playoffQualifiedCount) {
      return
    }

    setIsGeneratingKnockout(true)
    setActionError(null)
    onError(null)

    try {
      const result = await window.api.tournaments.generateKnockout(
        tournament.id,
        tournament.playoffQualifiedCount,
      )
      await onRefresh()
      onPhaseChange(result.knockoutPhaseId)
    } catch (error) {
      const message = getErrorMessage(error, t)
      setActionError(message)
      onError(message)
    } finally {
      setIsGeneratingKnockout(false)
    }
  }

  return (
    <div className="tournament-phase-actions card">
      {playoffsAction.visible && (
        <div className="tournament-phase-actions__block">
          <div className="tournament-phase-actions__copy">
            <h3 className="tournament-phase-actions__title">
              {t('tournaments.phaseActions.playoffs')}
            </h3>
            {playoffsAction.hint && (
              <p className="tournament-phase-actions__hint">{playoffsAction.hint}</p>
            )}
          </div>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => void handleGeneratePlayoffs()}
            disabled={!playoffsAction.enabled || isGeneratingPlayoffs}
          >
            {isGeneratingPlayoffs
              ? t('common.generating')
              : t('tournaments.phaseActions.generatePlayoffs')}
          </button>
        </div>
      )}

      {knockoutAction.visible && (
        <div className="tournament-phase-actions__block">
          <div className="tournament-phase-actions__copy">
            <h3 className="tournament-phase-actions__title">
              {t('tournaments.phaseActions.knockout')}
            </h3>
            {knockoutAction.hint && (
              <p className="tournament-phase-actions__hint">{knockoutAction.hint}</p>
            )}
          </div>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => void handleGenerateKnockout()}
            disabled={!knockoutAction.enabled || isGeneratingKnockout}
          >
            {isGeneratingKnockout
              ? t('common.generating')
              : t('tournaments.phaseActions.generateKnockout')}
          </button>
        </div>
      )}

      {actionError && <div className="alert alert--error">{actionError}</div>}
    </div>
  )
}

export async function startKnockoutOnlyTournament(
  tournamentId: string,
  players: Player[],
): Promise<string> {
  const result = await window.api.tournaments.generateKnockoutOnly(
    tournamentId,
    players.map((player) => player.id),
  )

  return result.knockoutPhaseId
}
