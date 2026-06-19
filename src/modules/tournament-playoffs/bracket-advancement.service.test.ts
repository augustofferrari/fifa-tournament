import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { BracketMatchRepository } from '../tournament-playoffs/bracket-match.repository'
import { KnockoutOnlyGenerationService } from '../tournament-knockout/knockout-only-generation.service'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { ValidationError } from '../tournaments/tournament.validation'
import { BracketRound } from '@shared/types/bracket-match'
import { TournamentFormat } from '@shared/types/tournament-format'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { ValidationMessages } from '@shared/validation'
import { translate } from '@shared/i18n'
import {
  GroupGenerationService,
  GroupStageFixtureService,
} from '../tournament-groups'
import { TournamentGroupRepository } from '../tournament-groups/tournament-group.repository'

describe('bracket winner advancement', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let tournamentPhaseService: TournamentPhaseService
  let matchRepository: MatchRepository
  let bracketMatchRepository: BracketMatchRepository
  let knockoutOnlyGenerationService: KnockoutOnlyGenerationService

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)

    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    tournamentPhaseService = new TournamentPhaseService(
      db,
      tournamentRepository,
      new TournamentPhaseRepository(db),
    )
    matchRepository = new MatchRepository(db, tournamentRepository, tournamentPhaseService)
    bracketMatchRepository = new BracketMatchRepository(db)
    knockoutOnlyGenerationService = new KnockoutOnlyGenerationService(
      db,
      tournamentRepository,
      tournamentPhaseService,
      matchRepository,
      bracketMatchRepository,
    )
  })

  afterEach(() => {
    db.close()
  })

  function createKnockoutOnlyTournament(playerNames: string[]) {
    const tournament = tournamentRepository.createTournament({
      name: 'Knockout Cup',
      format: TournamentFormat.KNOCKOUT_ONLY,
    })
    const players = playerNames.map((name) => playerRepository.createPlayer({ name }))
    const playerIds = players.map((player) => player.id)
    tournamentRepository.addPlayersToTournament(tournament.id, playerIds)
    tournamentPhaseService.createPhasesForTournament(tournament.id)

    return { tournament, playerIds }
  }

  it('stores the winner and creates the final after both semifinals are played', () => {
    const { tournament, playerIds } = createKnockoutOnlyTournament(['P1', 'P2', 'P3', 'P4'])
    const generated = knockoutOnlyGenerationService.generateKnockout({
      tournamentId: tournament.id,
      playerIds,
    })

    const semifinals = generated.firstRoundMatches
    expect(semifinals).toHaveLength(2)

    matchRepository.updateMatchResult(semifinals[0]!.id, 2, 1)
    const semifinalBracketOne = bracketMatchRepository.getBracketMatchByMatchId(semifinals[0]!.id)!
    expect(semifinalBracketOne.winnerPlayerId).toBe(semifinals[0]!.homePlayerId)

    let finalBracket = generated.bracketMatches.find(
      (entry) => entry.bracketRound === BracketRound.FINAL,
    )!
    expect(finalBracket.matchId).toBeNull()

    matchRepository.updateMatchResult(semifinals[1]!.id, 0, 1)
    finalBracket = bracketMatchRepository.getBracketMatchById(finalBracket.id)!
    expect(finalBracket.matchId).not.toBeNull()

    const finalMatch = matchRepository.getMatchById(finalBracket.matchId!)!
    expect([finalMatch.homePlayerId, finalMatch.awayPlayerId].sort()).toEqual(
      [semifinals[0]!.homePlayerId, semifinals[1]!.awayPlayerId].sort(),
    )
  })

  it('completes the phase and marks the tournament finished when the final is played', () => {
    const { tournament, playerIds } = createKnockoutOnlyTournament(['P1', 'P2'])
    const generated = knockoutOnlyGenerationService.generateKnockout({
      tournamentId: tournament.id,
      playerIds,
    })

    const finalMatch = generated.firstRoundMatches[0]!
    matchRepository.updateMatchResult(finalMatch.id, 1, 0)

    const phase = tournamentPhaseService
      .getTournamentPhases(tournament.id)
      .find((entry) => entry.phaseType === TournamentPhaseType.KNOCKOUT)!
    expect(phase.status).toBe('completed')
    expect(tournamentRepository.getTournamentById(tournament.id)?.status).toBe('finished')

    const finalBracket = bracketMatchRepository.getBracketMatchByMatchId(finalMatch.id)!
    expect(finalBracket.winnerPlayerId).toBe(finalMatch.homePlayerId)
  })

  it('rejects draws in knockout matches', () => {
    const { tournament, playerIds } = createKnockoutOnlyTournament(['P1', 'P2', 'P3', 'P4'])
    const generated = knockoutOnlyGenerationService.generateKnockout({
      tournamentId: tournament.id,
      playerIds,
    })

    expect(() =>
      matchRepository.updateMatchResult(generated.firstRoundMatches[0]!.id, 1, 1),
    ).toThrow(ValidationError)
    expect(() =>
      matchRepository.updateMatchResult(generated.firstRoundMatches[0]!.id, 1, 1),
    ).toThrow(translate(ValidationMessages.knockoutRequiresWinner, 'en'))
  })

  it('still allows draws in group stage matches', () => {
    const tournamentGroupRepository = new TournamentGroupRepository(db)
    const groupGenerationService = new GroupGenerationService(
      db,
      tournamentRepository,
      tournamentGroupRepository,
      tournamentPhaseService,
    )
    const groupStageFixtureService = new GroupStageFixtureService(
      db,
      tournamentRepository,
      tournamentGroupRepository,
      tournamentPhaseService,
      matchRepository,
    )

    const tournament = tournamentRepository.createTournament({
      name: 'Groups Cup',
      format: TournamentFormat.GROUPS_KNOCKOUT,
      groupCount: 2,
      playersPerGroup: 2,
      playoffQualifiedCount: 2,
    })
    const players = ['A1', 'A2', 'B1', 'B2'].map((name) =>
      playerRepository.createPlayer({ name }),
    )
    const playerIds = players.map((player) => player.id)
    tournamentRepository.addPlayersToTournament(tournament.id, playerIds)
    tournamentPhaseService.createPhasesForTournament(tournament.id)
    groupGenerationService.generateGroups({
      tournamentId: tournament.id,
      groupCount: 2,
      playerIds,
    })
    groupStageFixtureService.generateFixture(tournament.id)

    const groupMatch = matchRepository
      .listMatchesByTournament({ tournamentId: tournament.id })
      .find((match) => match.groupId !== null)!

    expect(() => matchRepository.updateMatchResult(groupMatch.id, 1, 1)).not.toThrow()
    expect(matchRepository.getMatchById(groupMatch.id)?.status).toBe('played')
  })
})
