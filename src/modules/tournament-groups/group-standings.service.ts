import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import { MatchRepository } from '@modules/matches/match.repository'
import { PlayerRepository } from '@modules/players/player.repository'
import { TournamentPhaseService } from '@modules/tournament-phases/tournament-phase.service'
import { calculateStandings } from '@modules/tournaments/standings.calculator'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import { assertNonEmptyString, ValidationError } from '@modules/tournaments/tournament.validation'
import type { Match } from '@shared/types/match'
import type { Player } from '@shared/types/player'
import type { GroupStandings } from '@shared/types/standings'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { createRemovedPlayer } from '@shared/validation'
import { TournamentGroupRepository } from './tournament-group.repository'

function resolveGroupPlayers(
  groupPlayerIds: string[],
  groupMatches: Match[],
  playerRepository: PlayerRepository,
): Player[] {
  const playersById = new Map<string, Player>()
  const orderedPlayerIds = [...groupPlayerIds]

  for (const playerId of groupPlayerIds) {
    playersById.set(
      playerId,
      playerRepository.getPlayerById(playerId) ?? createRemovedPlayer(playerId),
    )
  }

  for (const match of groupMatches) {
    for (const playerId of [match.homePlayerId, match.awayPlayerId]) {
      if (playersById.has(playerId)) {
        continue
      }

      playersById.set(
        playerId,
        playerRepository.getPlayerById(playerId) ?? createRemovedPlayer(playerId),
      )
      orderedPlayerIds.push(playerId)
    }
  }

  return orderedPlayerIds
    .map((playerId) => playersById.get(playerId))
    .filter((player): player is Player => player !== undefined)
}

export class GroupStandingsService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly tournamentGroupRepository: TournamentGroupRepository = new TournamentGroupRepository(
      db,
    ),
    private readonly tournamentPhaseService: TournamentPhaseService = new TournamentPhaseService(db),
    private readonly matchRepository: MatchRepository = new MatchRepository(db),
    private readonly playerRepository: PlayerRepository = new PlayerRepository(db),
  ) {}

  getGroupStandings(tournamentId: string): GroupStandings[] {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const tournament = this.tournamentRepository.getTournamentById(validatedTournamentId)

    if (!tournament) {
      throw new ValidationError(`Tournament not found: ${validatedTournamentId}`)
    }

    const groupStagePhase = this.tournamentPhaseService
      .getTournamentPhases(validatedTournamentId)
      .find((phase) => phase.phaseType === TournamentPhaseType.GROUP_STAGE)

    if (!groupStagePhase) {
      return []
    }

    const groups = this.tournamentGroupRepository.listGroupsByPhase(groupStagePhase.id)

    if (groups.length === 0) {
      return []
    }

    const matches = this.matchRepository.listMatchesByTournament({
      tournamentId: validatedTournamentId,
    })

    return groups.map((group) => {
      const groupPlayerIds = this.tournamentGroupRepository
        .listGroupPlayersByGroupId(group.id)
        .map((player) => player.playerId)
      const groupMatches = matches.filter((match) => match.groupId === group.id)
      const players = resolveGroupPlayers(groupPlayerIds, groupMatches, this.playerRepository)

      return {
        groupId: group.id,
        groupName: group.name,
        standings: calculateStandings(players, groupMatches, tournament),
      }
    })
  }
}
