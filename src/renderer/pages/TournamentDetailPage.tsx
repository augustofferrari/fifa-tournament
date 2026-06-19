import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '@shared/ipc/errors'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import { getTournamentFormatLabel, TournamentFormat } from '@shared/types/tournament-format'
import { TournamentPhaseType, type TournamentPhase } from '@shared/types/tournament-phase'
import { createRemovedPlayer, getPlayerDisplayName } from '@shared/validation'
import { PlayerPhoto } from '@renderer/components/players/PlayerPhoto'
import {
  BracketView,
  GroupStageView,
  MatchResultModal,
  StandingsTable,
  TournamentAwardsSection,
  TournamentMatches,
  TournamentPhaseActions,
  startKnockoutOnlyTournament,
  TournamentPhaseTabs,
  isPhaseReadOnly,
} from '@renderer/components/tournaments'
import { getKnockoutOnlyStartHint } from '@renderer/components/tournaments/tournament-phase-actions.utils'

function isBracketPhase(phaseType: TournamentPhaseType): boolean {
  return phaseType === TournamentPhaseType.PLAYOFF || phaseType === TournamentPhaseType.KNOCKOUT
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

function statusLabel(status: Tournament['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function resolveInitialPhaseId(phases: TournamentPhase[]): string | null {
  const activePhase = phases.find((phase) => phase.status === 'active')

  if (activePhase) {
    return activePhase.id
  }

  return phases[0]?.id ?? null
}

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [phases, setPhases] = useState<TournamentPhase[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingResult, setIsSavingResult] = useState(false)
  const [isUpdatingResultsLock, setIsUpdatingResultsLock] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playersById = useMemo(() => {
    const map = new Map(players.map((player) => [player.id, player]))

    for (const match of matches) {
      if (!map.has(match.homePlayerId)) {
        map.set(match.homePlayerId, createRemovedPlayer(match.homePlayerId))
      }

      if (!map.has(match.awayPlayerId)) {
        map.set(match.awayPlayerId, createRemovedPlayer(match.awayPlayerId))
      }
    }

    return map
  }, [players, matches])

  const selectedPhase = useMemo(
    () => phases.find((phase) => phase.id === selectedPhaseId) ?? null,
    [phases, selectedPhaseId],
  )

  const phaseMatches = useMemo(() => {
    if (!selectedPhase) {
      return matches
    }

    return matches.filter((match) => match.phaseId === selectedPhase.id)
  }, [matches, selectedPhase])

  const loadTournament = useCallback(async () => {
    if (!id) {
      setError('Tournament not found')
      setIsLoading(false)
      return
    }

    setError(null)

    try {
      const [tournamentData, tournamentPlayers, tournamentPhases, tournamentMatches] =
        await Promise.all([
          window.api.tournaments.getById(id),
          window.api.tournaments.getPlayers(id),
          window.api.tournaments.getPhases(id),
          window.api.matches.list({ tournamentId: id }),
        ])

      if (!tournamentData) {
        setError('Tournament not found')
        return
      }

      setTournament(tournamentData)
      setPlayers(tournamentPlayers)
      setPhases(tournamentPhases)
      setMatches(tournamentMatches)
      setSelectedPhaseId((current) => {
        if (current && tournamentPhases.some((phase) => phase.id === current)) {
          return current
        }

        return resolveInitialPhaseId(tournamentPhases)
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadTournament()
  }, [loadTournament])

  async function handleGenerateFixture() {
    if (!id) {
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      await window.api.matches.generateFixture(id)
      await loadTournament()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleStartKnockoutOnlyTournament() {
    if (!id) {
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const knockoutPhaseId = await startKnockoutOnlyTournament(id, players)
      await loadTournament()
      setSelectedPhaseId(knockoutPhaseId)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsGenerating(false)
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
      await loadTournament()
    } catch (err) {
      throw err
    } finally {
      setIsSavingResult(false)
    }
  }

  async function handleToggleResultsUnlocked() {
    if (!tournament) {
      return
    }

    setIsUpdatingResultsLock(true)
    setError(null)

    try {
      const updated = await window.api.tournaments.setResultsUnlocked(
        tournament.id,
        !tournament.resultsUnlocked,
      )
      setTournament(updated)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsUpdatingResultsLock(false)
    }
  }

  const selectedHomePlayerName = selectedMatch
    ? getPlayerDisplayName(playersById, selectedMatch.homePlayerId)
    : ''
  const selectedAwayPlayerName = selectedMatch
    ? getPlayerDisplayName(playersById, selectedMatch.awayPlayerId)
    : ''

  const isSelectedPhaseReadOnly =
    tournament && selectedPhase ? isPhaseReadOnly(tournament, selectedPhase) : false
  const knockoutOnlyStartHint = tournament
    ? getKnockoutOnlyStartHint(tournament, matches)
    : null

  if (isLoading) {
    return (
      <section className="page page--wide">
        <div className="page__empty">Loading tournament…</div>
      </section>
    )
  }

  if (error && !tournament) {
    return (
      <section className="page page--wide">
        <Link className="btn btn--ghost" to="/tournaments">
          Back to Tournaments
        </Link>
        <div className="alert alert--error">{error ?? 'Tournament not found'}</div>
      </section>
    )
  }

  if (!tournament) {
    return (
      <section className="page page--wide">
        <Link className="btn btn--ghost" to="/tournaments">
          Back to Tournaments
        </Link>
        <div className="alert alert--error">Tournament not found</div>
      </section>
    )
  }

  return (
    <section className="page page--wide">
      <div className="page-toolbar page-toolbar--start">
        <Link className="btn btn--ghost" to="/tournaments">
          Back to Tournaments
        </Link>
        {tournament.status === 'finished' && (
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => void handleToggleResultsUnlocked()}
            disabled={isUpdatingResultsLock}
          >
            {isUpdatingResultsLock
              ? 'Updating…'
              : tournament.resultsUnlocked
                ? 'Lock results'
                : 'Unlock results'}
          </button>
        )}
        {tournament.status === 'draft' && tournament.format === TournamentFormat.KNOCKOUT_ONLY && (
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => void handleStartKnockoutOnlyTournament()}
            disabled={isGenerating || players.length < 2}
          >
            {isGenerating ? 'Starting…' : 'Start Tournament'}
          </button>
        )}
        {tournament.status === 'draft' &&
          tournament.format !== TournamentFormat.GROUPS_KNOCKOUT &&
          tournament.format !== TournamentFormat.KNOCKOUT_ONLY && (
          <button
            className="btn btn--primary"
            type="button"
            onClick={handleGenerateFixture}
            disabled={isGenerating || players.length < 2}
          >
            {isGenerating ? 'Generating…' : 'Generate Fixture'}
          </button>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {knockoutOnlyStartHint && (
        <p className="tournament-detail__phase-notice">{knockoutOnlyStartHint}</p>
      )}

      <header className="page-header">
        <div className="tournament-detail__heading">
          <h1 className="page-header__title">{tournament.name}</h1>
          <span className="tournament-detail__format-badge">
            {getTournamentFormatLabel(tournament.format)}
          </span>
          <span className={`status-badge status-badge--${tournament.status}`}>
            {statusLabel(tournament.status)}
          </span>
        </div>
        <p className="page-header__description">
          Scoring: {tournament.pointsWin} pts win · {tournament.pointsDraw} pts draw ·{' '}
          {tournament.pointsLoss} pts loss
        </p>
      </header>

      <div className="card tournament-detail__players">
        <h2 className="tournament-detail__section-title">Players ({players.length})</h2>

        {players.length === 0 ? (
          <p className="tournament-detail__empty">No players in this tournament.</p>
        ) : (
          <ul className="tournament-detail__player-list">
            {players.map((player) => (
              <li key={player.id} className="tournament-detail__player-item">
                <PlayerPhoto photoPath={player.photoPath} alt={player.name} size="sm" />
                <div>
                  <div className="tournament-detail__player-name">{player.name}</div>
                  {player.teamName && (
                    <div className="tournament-detail__player-meta">{player.teamName}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {phases.length > 0 && selectedPhaseId && (
        <TournamentPhaseTabs
          phases={phases}
          selectedPhaseId={selectedPhaseId}
          onSelectPhase={setSelectedPhaseId}
        />
      )}

      {selectedPhase && isSelectedPhaseReadOnly && (
        <p className="tournament-detail__phase-notice">
          {tournament.status === 'finished' && !tournament.resultsUnlocked
            ? 'This tournament is finished. Unlock results editing to change match scores.'
            : `This phase is ${selectedPhase.status}. Match results are read-only.`}
        </p>
      )}

      <TournamentPhaseActions
        tournament={tournament}
        phases={phases}
        selectedPhase={selectedPhase}
        matches={matches}
        onRefresh={loadTournament}
        onPhaseChange={setSelectedPhaseId}
        onError={setError}
      />

      {selectedPhase?.phaseType === TournamentPhaseType.GROUP_STAGE && id && (
        <GroupStageView
          tournament={tournament}
          players={players}
          playersById={playersById}
          matches={phaseMatches}
          readOnly={isSelectedPhaseReadOnly}
          onRefresh={loadTournament}
        />
      )}

      {selectedPhase?.phaseType === TournamentPhaseType.ROUND_ROBIN && id && (
        <StandingsTable
          tournamentId={id}
          phaseId={selectedPhase.id}
          refreshTrigger={matches}
        />
      )}

      {selectedPhase && isBracketPhase(selectedPhase.phaseType) && (
        <BracketView
          phase={selectedPhase}
          playersById={playersById}
          readOnly={isSelectedPhaseReadOnly}
          onRefresh={loadTournament}
          refreshTrigger={matches}
        />
      )}

      {matches.length > 0 &&
        id &&
        (!selectedPhase ||
          selectedPhase.orderIndex ===
            Math.max(...phases.map((phase) => phase.orderIndex))) && (
          <TournamentAwardsSection tournamentId={id} refreshTrigger={matches} />
        )}

      {selectedPhase &&
        !isBracketPhase(selectedPhase.phaseType) &&
        selectedPhase.phaseType !== TournamentPhaseType.GROUP_STAGE && (
        <TournamentMatches
          matches={phaseMatches}
          playersById={playersById}
          onSelectMatch={setSelectedMatch}
          readOnly={isSelectedPhaseReadOnly}
        />
      )}

      {tournament.status === 'draft' &&
        matches.length === 0 &&
        tournament.format !== TournamentFormat.GROUPS_KNOCKOUT && (
        <div className="page__empty">
          Generate the fixture to create matches for this tournament.
        </div>
      )}

      {selectedPhase &&
        !isBracketPhase(selectedPhase.phaseType) &&
        selectedPhase.phaseType !== TournamentPhaseType.GROUP_STAGE &&
        phaseMatches.length === 0 &&
        matches.length > 0 && (
        <div className="page__empty">No matches in this phase yet.</div>
      )}

      {selectedPhase &&
        !isBracketPhase(selectedPhase.phaseType) &&
        selectedPhase.phaseType !== TournamentPhaseType.GROUP_STAGE && (
        <MatchResultModal
          match={selectedMatch}
          homePlayerName={selectedHomePlayerName}
          awayPlayerName={selectedAwayPlayerName}
          phaseType={selectedPhase.phaseType}
          isSaving={isSavingResult}
          onClose={() => setSelectedMatch(null)}
          onSave={handleSaveMatchResult}
        />
      )}
    </section>
  )
}
