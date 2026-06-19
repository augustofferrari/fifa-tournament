import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { ApiError } from '@shared/ipc/errors'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { BracketView, BracketViewMatch } from '@shared/types/bracket-view'
import type { TournamentPhase } from '@shared/types/tournament-phase'
import { getPlayerDisplayName } from '@shared/validation'
import { matchStatusLabel } from '@renderer/utils/matches'
import { MatchResultModal } from './MatchResultModal'

interface BracketViewProps {
  phase: TournamentPhase
  playersById: Map<string, Player>
  readOnly?: boolean
  onRefresh: () => Promise<void>
  refreshTrigger?: unknown
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

function getBracketMatchStatusLabel(status: BracketViewMatch['status']): string {
  if (status === 'pending') {
    return 'Pending'
  }

  return matchStatusLabel(status)
}

function BracketMatchCard({
  match,
  readOnly,
  onSelect,
}: {
  match: BracketViewMatch
  readOnly: boolean
  onSelect: (matchId: string) => void
}) {
  const content = (
    <>
      <div className="bracket-view__match-header">
        <span className="bracket-view__match-label">Match {match.bracketPosition}</span>
        <span className={`status-badge status-badge--match-${match.status}`}>
          {getBracketMatchStatusLabel(match.status)}
        </span>
      </div>

      <div className="bracket-view__participants">
        <div
          className={`bracket-view__participant${match.home.isPending ? ' bracket-view__participant--pending' : ''}`}
        >
          <span className="bracket-view__participant-name">{match.home.label}</span>
          <span className="bracket-view__participant-score">
            {match.home.score ?? '–'}
          </span>
        </div>
        <div
          className={`bracket-view__participant${match.away.isPending ? ' bracket-view__participant--pending' : ''}`}
        >
          <span className="bracket-view__participant-name">{match.away.label}</span>
          <span className="bracket-view__participant-score">
            {match.away.score ?? '–'}
          </span>
        </div>
      </div>

      {match.canEnterResult && !readOnly && (
        <span className="bracket-view__match-action">
          {match.status === 'played' ? 'Edit result' : 'Enter result'}
        </span>
      )}
    </>
  )

  if (match.canEnterResult && !readOnly && match.matchId) {
    return (
      <button
        type="button"
        className="bracket-view__match bracket-view__match--interactive"
        onClick={() => onSelect(match.matchId!)}
      >
        {content}
      </button>
    )
  }

  return <div className="bracket-view__match">{content}</div>
}

export function BracketViewComponent({
  phase,
  playersById,
  readOnly = false,
  onRefresh,
  refreshTrigger,
}: BracketViewProps) {
  const [bracketView, setBracketView] = useState<BracketView | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingResult, setIsSavingResult] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBracketView = useCallback(async () => {
    setError(null)

    try {
      const data = await window.api.tournaments.getBracketView(phase.id)
      setBracketView(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [phase.id])

  useEffect(() => {
    void loadBracketView()
  }, [loadBracketView, refreshTrigger])

  async function handleSelectMatch(matchId: string) {
    try {
      const tournamentMatches = await window.api.matches.list({ tournamentId: phase.tournamentId })
      const match = tournamentMatches.find((entry) => entry.id === matchId) ?? null
      setSelectedMatch(match)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleSaveMatchResult(homeGoals: number, awayGoals: number) {
    if (!selectedMatch) {
      return
    }

    setIsSavingResult(true)

    try {
      await window.api.matches.updateResult(selectedMatch.id, homeGoals, awayGoals)
      setSelectedMatch(null)
      await onRefresh()
      await loadBracketView()
    } catch (err) {
      throw err
    } finally {
      setIsSavingResult(false)
    }
  }

  const selectedHomePlayerName = selectedMatch
    ? getPlayerDisplayName(playersById, selectedMatch.homePlayerId)
    : ''
  const selectedAwayPlayerName = selectedMatch
    ? getPlayerDisplayName(playersById, selectedMatch.awayPlayerId)
    : ''

  if (isLoading) {
    return (
      <div className="card bracket-view">
        <p className="bracket-view__empty">Loading bracket…</p>
      </div>
    )
  }

  if (!bracketView || bracketView.rounds.length === 0) {
    return (
      <div className="card bracket-view">
        <h2 className="tournament-detail__section-title">Bracket</h2>
        <p className="bracket-view__empty">The bracket has not been generated yet.</p>
        {error && <div className="alert alert--error">{error}</div>}
      </div>
    )
  }

  return (
    <div className="card bracket-view">
      <h2 className="tournament-detail__section-title">Bracket</h2>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="bracket-view__rounds">
        {bracketView.rounds.map((round) => (
          <section key={round.round} className="bracket-view__round">
            <h3 className="bracket-view__round-title">{round.label}</h3>

            <div
              className="bracket-view__round-matches"
              style={{ '--round-match-count': round.matches.length } as CSSProperties}
            >
              {round.matches.map((match) => (
                <BracketMatchCard
                  key={match.bracketMatchId}
                  match={match}
                  readOnly={readOnly}
                  onSelect={(matchId) => void handleSelectMatch(matchId)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <MatchResultModal
        match={selectedMatch}
        homePlayerName={selectedHomePlayerName}
        awayPlayerName={selectedAwayPlayerName}
        phaseType={phase.phaseType}
        isSaving={isSavingResult}
        onClose={() => setSelectedMatch(null)}
        onSave={handleSaveMatchResult}
      />
    </div>
  )
}

export { BracketViewComponent as BracketView }
