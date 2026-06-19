import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '@shared/ipc/errors'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { Tournament } from '@shared/types/tournament'
import { createRemovedPlayer, getPlayerDisplayName } from '@shared/validation'
import { PlayerPhoto } from '@renderer/components/players/PlayerPhoto'
import {
  MatchResultModal,
  StandingsTable,
  TournamentMatches,
} from '@renderer/components/tournaments'

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

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingResult, setIsSavingResult] = useState(false)
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

  const loadTournament = useCallback(async () => {
    if (!id) {
      setError('Tournament not found')
      setIsLoading(false)
      return
    }

    setError(null)

    try {
      const [tournamentData, tournamentPlayers, tournamentMatches] = await Promise.all([
        window.api.tournaments.getById(id),
        window.api.tournaments.getPlayers(id),
        window.api.matches.list({ tournamentId: id }),
      ])

      if (!tournamentData) {
        setError('Tournament not found')
        return
      }

      setTournament(tournamentData)
      setPlayers(tournamentPlayers)
      setMatches(tournamentMatches)
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

  const selectedHomePlayerName = selectedMatch
    ? getPlayerDisplayName(playersById, selectedMatch.homePlayerId)
    : ''
  const selectedAwayPlayerName = selectedMatch
    ? getPlayerDisplayName(playersById, selectedMatch.awayPlayerId)
    : ''

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
        {tournament.status === 'draft' && (
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

      <header className="page-header">
        <div className="tournament-detail__heading">
          <h1 className="page-header__title">{tournament.name}</h1>
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

      {matches.length > 0 && id && (
        <StandingsTable tournamentId={id} refreshTrigger={matches} />
      )}

      <TournamentMatches
        matches={matches}
        playersById={playersById}
        onSelectMatch={setSelectedMatch}
      />

      {tournament.status === 'draft' && matches.length === 0 && (
        <div className="page__empty">
          Generate the fixture to create round robin matches for this tournament.
        </div>
      )}

      <MatchResultModal
        match={selectedMatch}
        homePlayerName={selectedHomePlayerName}
        awayPlayerName={selectedAwayPlayerName}
        isSaving={isSavingResult}
        onClose={() => setSelectedMatch(null)}
        onSave={handleSaveMatchResult}
      />
    </section>
  )
}
