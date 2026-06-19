import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@shared/ipc/errors'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { GroupStandings } from '@shared/types/standings'
import type { Tournament } from '@shared/types/tournament'
import type { TournamentGroupWithPlayers } from '@shared/types/tournament-group'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { getPlayerDisplayName } from '@shared/validation'
import { PlayerPhoto } from '@renderer/components/players/PlayerPhoto'
import {
  formatMatchResult,
  groupMatchesByRound,
  matchStatusLabel,
} from '@renderer/utils/matches'
import { MatchResultModal } from './MatchResultModal'

interface GroupStageViewProps {
  tournament: Tournament
  players: Player[]
  playersById: Map<string, Player>
  matches: Match[]
  readOnly?: boolean
  onRefresh: () => Promise<void>
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

function GroupStandingsMini({ standings }: { standings: GroupStandings['standings'] }) {
  if (standings.length === 0) {
    return <p className="group-stage-view__empty">No standings yet.</p>
  }

  return (
    <div className="table-wrap">
      <table className="table standings-table">
        <thead>
          <tr>
            <th className="standings-table__pos-col">#</th>
            <th>Player</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => {
            const position = index + 1
            const isLeader = position === 1

            return (
              <tr
                key={row.playerId}
                className={isLeader ? 'standings-table__row--leader' : undefined}
              >
                <td className="standings-table__pos">{position}</td>
                <td className="table__primary">{row.playerName}</td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td>{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function GroupStageView({
  tournament,
  players,
  playersById,
  matches,
  readOnly = false,
  onRefresh,
}: GroupStageViewProps) {
  const [groups, setGroups] = useState<TournamentGroupWithPlayers[]>([])
  const [groupStandings, setGroupStandings] = useState<GroupStandings[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false)
  const [isGeneratingFixture, setIsGeneratingFixture] = useState(false)
  const [isSavingResult, setIsSavingResult] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadGroupData = useCallback(async () => {
    setError(null)

    try {
      const [groupsData, standingsData] = await Promise.all([
        window.api.tournaments.getGroups(tournament.id),
        window.api.tournaments.getGroupStandings(tournament.id),
      ])

      setGroups(groupsData)
      setGroupStandings(standingsData)
      setSelectedGroupId((current) => {
        if (current && groupsData.some((group) => group.id === current)) {
          return current
        }

        return groupsData[0]?.id ?? null
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [tournament.id])

  useEffect(() => {
    void loadGroupData()
  }, [loadGroupData, matches])

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  )

  const selectedGroupStandings = useMemo(
    () => groupStandings.find((group) => group.groupId === selectedGroupId) ?? null,
    [groupStandings, selectedGroupId],
  )

  const selectedGroupMatches = useMemo(() => {
    if (!selectedGroupId) {
      return []
    }

    return matches.filter((match) => match.groupId === selectedGroupId)
  }, [matches, selectedGroupId])

  async function handleGenerateGroups() {
    if (!tournament.groupCount) {
      setError('Tournament group count is not configured')
      return
    }

    setIsGeneratingGroups(true)
    setError(null)

    try {
      await window.api.tournaments.generateGroups(
        tournament.id,
        tournament.groupCount,
        players.map((player) => player.id),
      )
      await onRefresh()
      await loadGroupData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsGeneratingGroups(false)
    }
  }

  async function handleGenerateFixture() {
    setIsGeneratingFixture(true)
    setError(null)

    try {
      await window.api.tournaments.generateGroupFixture(tournament.id)
      await onRefresh()
      await loadGroupData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsGeneratingFixture(false)
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
      await loadGroupData()
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
      <div className="card group-stage-view">
        <p className="group-stage-view__empty">Loading group stage…</p>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="card group-stage-view">
        <h2 className="tournament-detail__section-title">Group Stage</h2>
        <p className="group-stage-view__empty">
          Groups have not been generated yet. Create groups to start the group stage.
        </p>
        {error && <div className="alert alert--error">{error}</div>}
        {!readOnly && (
          <div className="group-stage-view__actions">
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => void handleGenerateGroups()}
              disabled={isGeneratingGroups || players.length < 2}
            >
              {isGeneratingGroups ? 'Generating…' : 'Generate Groups'}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="card group-stage-view">
        <h2 className="tournament-detail__section-title">Group Stage</h2>
        <p className="group-stage-view__empty">
          Groups are ready. Generate the group stage fixture to create matches.
        </p>
        {error && <div className="alert alert--error">{error}</div>}
        {!readOnly && (
          <div className="group-stage-view__actions">
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => void handleGenerateFixture()}
              disabled={isGeneratingFixture}
            >
              {isGeneratingFixture ? 'Generating…' : 'Generate Group Fixture'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const rounds = groupMatchesByRound(selectedGroupMatches)

  return (
    <div className="card group-stage-view">
      <h2 className="tournament-detail__section-title">Group Stage</h2>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="group-stage-view__tabs" role="tablist" aria-label="Groups">
        {groups.map((group) => {
          const isSelected = group.id === selectedGroupId

          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`group-stage-view__tab${isSelected ? ' group-stage-view__tab--selected' : ''}`}
              onClick={() => setSelectedGroupId(group.id)}
            >
              {group.name}
            </button>
          )
        })}
      </div>

      {selectedGroup && (
        <div className="group-stage-view__panel" role="tabpanel">
          <section className="group-stage-view__section">
            <h3 className="group-stage-view__section-title">Players</h3>
            <ul className="group-stage-view__players">
              {selectedGroup.players.map((assignment) => {
                const player = playersById.get(assignment.playerId)

                return (
                  <li key={assignment.playerId} className="group-stage-view__player">
                    <PlayerPhoto
                      photoPath={player?.photoPath ?? null}
                      alt={getPlayerDisplayName(playersById, assignment.playerId)}
                      size="sm"
                    />
                    <div>
                      <div className="group-stage-view__player-name">
                        {getPlayerDisplayName(playersById, assignment.playerId)}
                      </div>
                      <div className="group-stage-view__player-meta">
                        Seed {assignment.seedPosition}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="group-stage-view__section">
            <h3 className="group-stage-view__section-title">Standings</h3>
            <GroupStandingsMini standings={selectedGroupStandings?.standings ?? []} />
          </section>

          <section className="group-stage-view__section">
            <h3 className="group-stage-view__section-title">Fixture</h3>

            {rounds.length === 0 ? (
              <p className="group-stage-view__empty">No matches scheduled for this group.</p>
            ) : (
              <div className="match-rounds">
                {rounds.map((round) => (
                  <section key={round.roundNumber} className="match-round">
                    <h4 className="match-round__title">Round {round.roundNumber}</h4>
                    <ul className="match-round__list">
                      {round.matches.map((match) => {
                        const result = formatMatchResult(match)

                        return (
                          <li key={match.id}>
                            {readOnly ? (
                              <div className="match-card match-card--readonly">
                                <div className="match-card__teams">
                                  <span className="match-card__team">
                                    {getPlayerDisplayName(playersById, match.homePlayerId)}
                                  </span>
                                  <span className="match-card__versus">{result ?? 'vs'}</span>
                                  <span className="match-card__team">
                                    {getPlayerDisplayName(playersById, match.awayPlayerId)}
                                  </span>
                                </div>
                                <div className="match-card__meta">
                                  <span
                                    className={`status-badge status-badge--match-${match.status}`}
                                  >
                                    {matchStatusLabel(match.status)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="match-card match-card--interactive"
                                onClick={() => setSelectedMatch(match)}
                              >
                                <div className="match-card__teams">
                                  <span className="match-card__team">
                                    {getPlayerDisplayName(playersById, match.homePlayerId)}
                                  </span>
                                  <span className="match-card__versus">{result ?? 'vs'}</span>
                                  <span className="match-card__team">
                                    {getPlayerDisplayName(playersById, match.awayPlayerId)}
                                  </span>
                                </div>
                                <div className="match-card__meta">
                                  <span
                                    className={`status-badge status-badge--match-${match.status}`}
                                  >
                                    {matchStatusLabel(match.status)}
                                  </span>
                                  <span className="match-card__action">
                                    {match.status === 'played' ? 'Edit result' : 'Enter result'}
                                  </span>
                                </div>
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <MatchResultModal
        match={selectedMatch}
        homePlayerName={selectedHomePlayerName}
        awayPlayerName={selectedAwayPlayerName}
        phaseType={TournamentPhaseType.GROUP_STAGE}
        isSaving={isSavingResult}
        onClose={() => setSelectedMatch(null)}
        onSave={handleSaveMatchResult}
      />
    </div>
  )
}
