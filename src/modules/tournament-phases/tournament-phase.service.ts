import type Database from 'better-sqlite3'
import { getDatabase } from '@database'
import { TournamentRepository } from '@modules/tournaments/tournament.repository'
import { assertNonEmptyString, ValidationError } from '@modules/tournaments/tournament.validation'
import type { TournamentPhase } from '@shared/types/tournament-phase'
import { getPhasePlanForFormat } from './tournament-phase.utils'
import { hasNextPhase } from '@shared/tournament/phase-completion.utils'
import { TournamentPhaseRepository } from './tournament-phase.repository'

export class TournamentPhaseService {
  constructor(
    private readonly db: Database.Database = getDatabase(),
    private readonly tournamentRepository: TournamentRepository = new TournamentRepository(db),
    private readonly tournamentPhaseRepository: TournamentPhaseRepository = new TournamentPhaseRepository(
      db,
    ),
  ) {}

  createPhasesForTournament(tournamentId: string): TournamentPhase[] {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const tournament = this.tournamentRepository.getTournamentById(validatedTournamentId)

    if (!tournament) {
      throw new ValidationError(`Tournament not found: ${validatedTournamentId}`)
    }

    if (this.tournamentPhaseRepository.countPhasesByTournament(validatedTournamentId) > 0) {
      throw new ValidationError('Phases have already been created for this tournament')
    }

    const plan = getPhasePlanForFormat(tournament.format)

    const createPhases = this.db.transaction(() =>
      plan.map((phasePlan) =>
        this.tournamentPhaseRepository.createPhase({
          tournamentId: validatedTournamentId,
          phaseType: phasePlan.phaseType,
          name: phasePlan.name,
          orderIndex: phasePlan.orderIndex,
          status: phasePlan.status,
        }),
      ),
    )

    return createPhases()
  }

  getTournamentPhases(tournamentId: string): TournamentPhase[] {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')

    if (!this.tournamentRepository.getTournamentById(validatedTournamentId)) {
      throw new ValidationError(`Tournament not found: ${validatedTournamentId}`)
    }

    return this.tournamentPhaseRepository.listPhasesByTournament(validatedTournamentId)
  }

  ensurePhasesForTournament(tournamentId: string): TournamentPhase[] {
    const phases = this.getTournamentPhases(tournamentId)

    if (phases.length > 0) {
      return phases
    }

    return this.createPhasesForTournament(tournamentId)
  }

  getActivePhase(tournamentId: string): TournamentPhase | null {
    const phases = this.getTournamentPhases(tournamentId)
    return phases.find((phase) => phase.status === 'active') ?? null
  }

  completePhase(phaseId: string): TournamentPhase {
    const validatedPhaseId = assertNonEmptyString(phaseId, 'phaseId')
    const phase = this.tournamentPhaseRepository.getPhaseById(validatedPhaseId)

    if (!phase) {
      throw new ValidationError(`Tournament phase not found: ${validatedPhaseId}`)
    }

    if (phase.status === 'completed') {
      return phase
    }

    return this.tournamentPhaseRepository.updatePhaseStatus(validatedPhaseId, 'completed')
  }

  tryAutoCompletePhaseAfterMatchResult(
    tournamentId: string,
    phaseId: string,
    allMatchesInPhasePlayed: boolean,
  ): void {
    if (!allMatchesInPhasePlayed) {
      return
    }

    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const validatedPhaseId = assertNonEmptyString(phaseId, 'phaseId')
    const phase = this.tournamentPhaseRepository.getPhaseById(validatedPhaseId)

    if (!phase || phase.status !== 'active') {
      return
    }

    this.completePhase(validatedPhaseId)

    const phases = this.getTournamentPhases(validatedTournamentId)

    if (!hasNextPhase(phases, phase)) {
      this.tournamentRepository.updateTournamentStatus(validatedTournamentId, 'finished')
    }
  }

  activateNextPhase(tournamentId: string): TournamentPhase {
    const validatedTournamentId = assertNonEmptyString(tournamentId, 'tournamentId')
    const phases = this.getTournamentPhases(validatedTournamentId)

    if (phases.some((phase) => phase.status === 'active')) {
      throw new ValidationError('Complete the active phase before activating the next one')
    }

    const nextPhase = phases.find((phase) => phase.status === 'pending')

    if (!nextPhase) {
      throw new ValidationError('No pending phase available to activate')
    }

    return this.tournamentPhaseRepository.updatePhaseStatus(nextPhase.id, 'active')
  }
}
