import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { BracketView } from '@shared/types/bracket-view'
import type { LatestMatchResult } from '@shared/types/latest-match-result'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { GroupStandings, StandingRow } from '@shared/types/standings'
import type { Tournament } from '@shared/types/tournament'
import { getTournamentFormatLabel } from '@shared/tournament/format-display.utils'
import { getPhaseTabLabel } from '@shared/tournament/phase-display.utils'
import type { TournamentPhase } from '@shared/types/tournament-phase'
import {
  TvBracketPanel,
  TvGroupStandingsPanel,
  TvLatestResultsPanel,
  TvNextMatchesPanel,
  TvStandingsPanel,
  TV_MODE_REFRESH_MS,
  buildPlayersById,
  filterLatestResultsForTournament,
  getNextMatchesForPhase,
  isBracketPhase,
  isGroupStandingsPhase,
  resolveDisplayPhase,
} from '@renderer/components/tv'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { getErrorMessage } from '@renderer/i18n/ipc-error'

export function TvModePage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const { t, locale } = useAppTranslation()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [phases, setPhases] = useState<TournamentPhase[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [groupStandings, setGroupStandings] = useState<GroupStandings[]>([])
  const [bracketView, setBracketView] = useState<BracketView | null>(null)
  const [latestResults, setLatestResults] = useState<LatestMatchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const displayPhase = useMemo(() => resolveDisplayPhase(phases), [phases])
  const playersById = useMemo(() => buildPlayersById(players), [players])

  const nextMatches = useMemo(
    () => getNextMatchesForPhase(matches, displayPhase),
    [matches, displayPhase],
  )

  const loadTournamentData = useCallback(async () => {
    if (!tournamentId) {
      return
    }

    setError(null)

    try {
      const [
        tournamentData,
        phaseData,
        playerData,
        matchData,
        latestResultData,
      ] = await Promise.all([
        window.api.tournaments.getById(tournamentId),
        window.api.tournaments.getPhases(tournamentId),
        window.api.tournaments.getPlayers(tournamentId),
        window.api.matches.list({ tournamentId }),
        window.api.matches.getLatestResults(50),
      ])

      if (!tournamentData) {
        setTournament(null)
        setError(t('tournaments.notFound'))
        return
      }

      const currentPhase = resolveDisplayPhase(phaseData)

      let standingsData: StandingRow[] = []
      let groupStandingsData: GroupStandings[] = []
      let bracketData: BracketView | null = null

      if (currentPhase) {
        if (isBracketPhase(currentPhase.phaseType)) {
          bracketData = await window.api.tournaments.getBracketView(currentPhase.id)
        } else if (isGroupStandingsPhase(currentPhase.phaseType)) {
          groupStandingsData = await window.api.tournaments.getGroupStandings(tournamentId)
        } else {
          standingsData = await window.api.tournaments.getStandings(tournamentId, currentPhase.id)
        }
      }

      setTournament(tournamentData)
      setPhases(phaseData)
      setPlayers(playerData)
      setMatches(matchData)
      setStandings(standingsData)
      setGroupStandings(groupStandingsData)
      setBracketView(bracketData)
      setLatestResults(filterLatestResultsForTournament(latestResultData, tournamentId))
      setLastUpdatedAt(new Date())
    } catch (err) {
      setError(getErrorMessage(err, t))
    } finally {
      setIsLoading(false)
    }
  }, [t, tournamentId])

  useEffect(() => {
    void loadTournamentData()
  }, [loadTournamentData])

  useEffect(() => {
    if (!tournamentId) {
      return
    }

    const intervalId = window.setInterval(() => {
      void loadTournamentData()
    }, TV_MODE_REFRESH_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [loadTournamentData, tournamentId])

  function formatPhaseStatus(status: TournamentPhase['status']): string {
    switch (status) {
      case 'active':
        return t('common.status.inProgress')
      case 'completed':
        return t('common.status.completed')
      case 'pending':
        return t('common.status.upcoming')
    }
  }

  if (!tournamentId) {
    return (
      <div className="tv-mode">
        <div className="tv-mode__message">{t('tv.missingTournamentId')}</div>
      </div>
    )
  }

  if (isLoading && !tournament) {
    return (
      <div className="tv-mode">
        <div className="tv-mode__message">{t('tv.loading')}</div>
      </div>
    )
  }

  if (error && !tournament) {
    return (
      <div className="tv-mode">
        <div className="tv-mode__message tv-mode__message--error">{error}</div>
        <Link className="tv-mode__exit" to={`/tournaments/${tournamentId}`}>
          {t('tv.backToTournament')}
        </Link>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="tv-mode">
        <div className="tv-mode__message">{t('tv.notFound')}</div>
      </div>
    )
  }

  return (
    <div className="tv-mode">
      <Link className="tv-mode__exit" to={`/tournaments/${tournamentId}`}>
        {t('tv.exitTvMode')}
      </Link>

      <header className="tv-mode__header">
        <div className="tv-mode__heading">
          <h1 className="tv-mode__title">{tournament.name}</h1>
          <div className="tv-mode__badges">
            <span className="tv-mode__badge">
              {getTournamentFormatLabel(tournament.format, locale)}
            </span>
            <span className={`tv-mode__badge tv-mode__badge--${tournament.status}`}>
              {t(`common.status.${tournament.status}`)}
            </span>
          </div>
        </div>

        <div className="tv-mode__phase">
          <span className="tv-mode__phase-label">{t('tv.currentPhase')}</span>
          <strong className="tv-mode__phase-name">
            {displayPhase ? getPhaseTabLabel(displayPhase.phaseType, locale) : t('common.emDash')}
          </strong>
          {displayPhase && (
            <span className={`tv-mode__phase-status tv-mode__phase-status--${displayPhase.status}`}>
              {formatPhaseStatus(displayPhase.status)}
            </span>
          )}
        </div>
      </header>

      {error && <div className="tv-mode__alert">{error}</div>}

      <div className="tv-mode__grid">
        <div className="tv-mode__main">
          {displayPhase && isBracketPhase(displayPhase.phaseType) && (
            <TvBracketPanel bracketView={bracketView} />
          )}
          {displayPhase && isGroupStandingsPhase(displayPhase.phaseType) && (
            <TvGroupStandingsPanel groups={groupStandings} />
          )}
          {displayPhase &&
            !isBracketPhase(displayPhase.phaseType) &&
            !isGroupStandingsPhase(displayPhase.phaseType) && (
              <TvStandingsPanel rows={standings} />
            )}
          {!displayPhase && (
            <section className="tv-panel tv-panel--main">
              <h2 className="tv-panel__title">{t('tv.tournament')}</h2>
              <p className="tv-panel__empty">{t('tv.noPhases')}</p>
            </section>
          )}
        </div>

        <aside className="tv-mode__sidebar">
          <TvLatestResultsPanel results={latestResults} />
          <TvNextMatchesPanel matches={nextMatches} playersById={playersById} />
        </aside>
      </div>

      {lastUpdatedAt && (
        <footer className="tv-mode__footer">
          {t('tv.updated', { time: lastUpdatedAt.toLocaleTimeString() })}
        </footer>
      )}
    </div>
  )
}
