import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import {
  FixtureGenerationError,
  type RoundRobinFixtureMatch,
} from '@modules/fixtures'
import { MatchRepository } from '@modules/matches/match.repository'
import { TournamentPhaseService } from '@modules/tournament-phases/tournament-phase.service'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import {
  assertNonEmptyString,
  nowIsoString,
  ValidationError,
} from '@modules/tournaments/tournament.validation'
import type { Match } from '@shared/types/match'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { ValidationMessages } from '@shared/validation'
import { generateGroupStageRoundRobinFixtures } from './group-stage.fixture'
import { MIN_PLAYERS_PER_GROUP } from './group-generation.calculator'
import { TournamentGroupRepository } from './tournament-group.repository'

interface GroupFixtureToInsert {
  groupId: string
  fixture: RoundRobinFixtureMatch
}

export class GroupStageFixtureService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly tournamentGroupRepository: TournamentGroupRepository = new TournamentGroupRepository(
      db,
    ),
    private readonly tournamentPhaseService: TournamentPhaseService = new TournamentPhaseService(db),
    private readonly matchRepository: MatchRepository = new MatchRepository(db),
  ) {}

  generateFixture(tournamentId: string): Match[] {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const tournament = this.tournamentRepository.getTournamentById(validatedTournamentId)

    if (!tournament) {
      throw new ValidationError(`Tournament not found: ${validatedTournamentId}`)
    }

    const groupStagePhase = this.tournamentPhaseService
      .getTournamentPhases(validatedTournamentId)
      .find(
        (phase) =>
          phase.phaseType === TournamentPhaseType.GROUP_STAGE && phase.status === 'active',
      )

    if (!groupStagePhase) {
      throw new ValidationError('Active group stage phase not found for this tournament')
    }

    if (this.matchRepository.countMatchesByPhase(groupStagePhase.id) > 0) {
      throw new ValidationError(ValidationMessages.fixtureAlreadyGenerated)
    }

    if (tournament.status !== 'draft') {
      throw new ValidationError('Fixture can only be generated for draft tournaments')
    }

    const groups = this.tournamentGroupRepository.listGroupsByPhase(groupStagePhase.id)

    if (groups.length === 0) {
      throw new ValidationError('Groups must be generated before creating group stage fixtures')
    }

    const groupInputs = groups.map((group) => {
      const players = this.tournamentGroupRepository.listGroupPlayersByGroupId(group.id)
      const playerIds = players.map((player) => player.playerId)

      if (playerIds.length < MIN_PLAYERS_PER_GROUP) {
        throw new ValidationError(
          `Group "${group.name}" must have at least ${MIN_PLAYERS_PER_GROUP} players`,
        )
      }

      return {
        groupId: group.id,
        playerIds,
      }
    })

    let groupAssignments

    try {
      groupAssignments = generateGroupStageRoundRobinFixtures(groupInputs)
    } catch (error) {
      if (error instanceof FixtureGenerationError) {
        throw new ValidationError(error.message)
      }

      throw error
    }

    const fixturesToInsert: GroupFixtureToInsert[] = groupAssignments.flatMap(
      ({ groupId, fixtures }) =>
        fixtures.map((fixture) => ({
          groupId,
          fixture,
        })),
    )

    const generateFixture = this.db.transaction(
      (entries: GroupFixtureToInsert[]): Match[] => {
        const matches = entries.map(({ groupId, fixture }) =>
          this.matchRepository.createMatch({
            tournamentId: validatedTournamentId,
            phaseId: groupStagePhase.id,
            groupId,
            roundNumber: fixture.roundNumber,
            homePlayerId: fixture.homePlayerId,
            awayPlayerId: fixture.awayPlayerId,
          }),
        )
        const updatedAt = nowIsoString()

        this.db
          .prepare(`UPDATE tournaments SET status = ?, updated_at = ? WHERE id = ?`)
          .run('active', updatedAt, validatedTournamentId)

        return matches
      },
    )

    return generateFixture(fixturesToInsert)
  }
}
