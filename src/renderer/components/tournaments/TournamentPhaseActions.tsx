import { useState } from 'react'
import { ApiError } from '@shared/ipc/errors'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import type { TournamentPhase } from '@shared/types/tournament-phase'
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

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
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
  const [isGeneratingPlayoffs, setIsGeneratingPlayoffs] = useState(false)
  const [isGeneratingKnockout, setIsGeneratingKnockout] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const playoffsAction = getGeneratePlayoffsActionState(
    tournament,
    phases,
    selectedPhase,
    matches,
  )
  const knockoutAction = getGenerateKnockoutActionState(
    tournament,
    phases,
    selectedPhase,
    matches,
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
      const message = getErrorMessage(error)
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
      const message = getErrorMessage(error)
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
            <h3 className="tournament-phase-actions__title">Playoffs</h3>
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
            {isGeneratingPlayoffs ? 'Generating…' : 'Generate Playoffs'}
          </button>
        </div>
      )}

      {knockoutAction.visible && (
        <div className="tournament-phase-actions__block">
          <div className="tournament-phase-actions__copy">
            <h3 className="tournament-phase-actions__title">Knockout</h3>
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
            {isGeneratingKnockout ? 'Generating…' : 'Generate Knockout'}
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
