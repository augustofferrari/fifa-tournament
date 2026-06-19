import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { BracketView, BracketViewMatch } from '@shared/types/bracket-view'
import type { TournamentPhase } from '@shared/types/tournament-phase'
import { getPlayerDisplayName } from '@shared/validation'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { getErrorMessage } from '@renderer/i18n/ipc-error'
import { displayPlayerName } from '@renderer/i18n/display-utils'
import { MatchResultModal } from './MatchResultModal'

interface BracketViewProps {
  phase: TournamentPhase
  playersById: Map<string, Player>
  readOnly?: boolean
  onRefresh: () => Promise<void>
  refreshTrigger?: unknown
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
  const { t } = useAppTranslation()

  const homeLabel = displayPlayerName(match.home.label, t)
  const awayLabel = displayPlayerName(match.away.label, t)

  const content = (
    <>
      <div className="bracket-view__match-header">
        <span className="bracket-view__match-label">
          {t('common.match', { number: match.bracketPosition })}
        </span>
        <span className={`status-badge status-badge--match-${match.status}`}>
          {t(`common.status.${match.status}`)}
        </span>
      </div>

      <div className="bracket-view__participants">
        <div
          className={`bracket-view__participant${match.home.isPending ? ' bracket-view__participant--pending' : ''}`}
        >
          <span className="bracket-view__participant-name">{homeLabel}</span>
          <span className="bracket-view__participant-score">
            {match.home.score ?? t('common.emDash')}
          </span>
        </div>
        <div
          className={`bracket-view__participant${match.away.isPending ? ' bracket-view__participant--pending' : ''}`}
        >
          <span className="bracket-view__participant-name">{awayLabel}</span>
          <span className="bracket-view__participant-score">
            {match.away.score ?? t('common.emDash')}
          </span>
        </div>
      </div>

      {match.canEnterResult && !readOnly && (
        <span className="bracket-view__match-action">
          {match.status === 'played'
            ? t('tournaments.match.editResult')
            : t('tournaments.match.enterResult')}
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
  const { t } = useAppTranslation()
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
      setError(getErrorMessage(err, t))
    } finally {
      setIsLoading(false)
    }
  }, [phase.id, t])

  useEffect(() => {
    void loadBracketView()
  }, [loadBracketView, refreshTrigger])

  async function handleSelectMatch(matchId: string) {
    try {
      const tournamentMatches = await window.api.matches.list({ tournamentId: phase.tournamentId })
      const match = tournamentMatches.find((entry) => entry.id === matchId) ?? null
      setSelectedMatch(match)
    } catch (err) {
      setError(getErrorMessage(err, t))
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
    ? displayPlayerName(getPlayerDisplayName(playersById, selectedMatch.homePlayerId), t)
    : ''
  const selectedAwayPlayerName = selectedMatch
    ? displayPlayerName(getPlayerDisplayName(playersById, selectedMatch.awayPlayerId), t)
    : ''

  if (isLoading) {
    return (
      <div className="card bracket-view">
        <p className="bracket-view__empty">{t('tournaments.bracketView.loading')}</p>
      </div>
    )
  }

  if (!bracketView || bracketView.rounds.length === 0) {
    return (
      <div className="card bracket-view">
        <h2 className="tournament-detail__section-title">{t('tournaments.bracket')}</h2>
        <p className="bracket-view__empty">{t('tournaments.bracketView.notGenerated')}</p>
        {error && <div className="alert alert--error">{error}</div>}
      </div>
    )
  }

  return (
    <div className="card bracket-view">
      <h2 className="tournament-detail__section-title">{t('tournaments.bracket')}</h2>

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
