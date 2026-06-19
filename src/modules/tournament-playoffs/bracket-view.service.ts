import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import { MatchRepository } from '@modules/matches/match.repository'
import { TournamentPhaseRepository } from '@modules/tournament-phases/tournament-phase.repository'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import { assertNonEmptyString, ValidationError } from '@modules/tournaments/tournament.validation'
import type { BracketView } from '@shared/types/bracket-view'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { createRemovedPlayer, isMatchResultsReadOnly, ValidationMessages } from '@shared/validation'
import { buildBracketView } from './bracket-view.calculator'
import { BracketMatchRepository } from './bracket-match.repository'

export class BracketViewService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly bracketMatchRepository: BracketMatchRepository = new BracketMatchRepository(db),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly tournamentPhaseRepository: TournamentPhaseRepository = new TournamentPhaseRepository(
      db,
    ),
    private readonly matchRepository: MatchRepository = new MatchRepository(db),
  ) {}

  getBracketView(phaseId: string): BracketView {
    const validatedPhaseId = assertNonEmptyString(phaseId, 'phaseId')
    const phase = this.tournamentPhaseRepository.getPhaseById(validatedPhaseId)

    if (!phase) {
      throw new ValidationError(`Tournament phase not found: ${validatedPhaseId}`)
    }

    if (
      phase.phaseType !== TournamentPhaseType.PLAYOFF &&
      phase.phaseType !== TournamentPhaseType.KNOCKOUT
    ) {
      throw new ValidationError('Bracket view is only available for playoff and knockout phases')
    }

    const bracketMatches = this.bracketMatchRepository.listBracketMatchesByPhase(validatedPhaseId)
    const matches = this.matchRepository
      .listMatchesByTournament({ tournamentId: phase.tournamentId })
      .filter((match) => match.phaseId === validatedPhaseId)
    const players = this.tournamentRepository.getTournamentPlayersIncludingRemoved(phase.tournamentId)
    const playersById = new Map(players.map((player) => [player.id, player]))

    for (const match of matches) {
      if (!playersById.has(match.homePlayerId)) {
        playersById.set(match.homePlayerId, createRemovedPlayer(match.homePlayerId))
      }

      if (!playersById.has(match.awayPlayerId)) {
        playersById.set(match.awayPlayerId, createRemovedPlayer(match.awayPlayerId))
      }
    }

    const tournament = this.tournamentRepository.getTournamentById(phase.tournamentId)

    if (!tournament) {
      throw new ValidationError(`Tournament not found: ${phase.tournamentId}`)
    }

    const getPlayerName = (playerId: string) =>
      playersById.get(playerId)?.name ?? ValidationMessages.removedPlayer

    return buildBracketView(
      validatedPhaseId,
      bracketMatches,
      matches,
      getPlayerName,
      !isMatchResultsReadOnly(tournament, phase),
    )
  }
}
