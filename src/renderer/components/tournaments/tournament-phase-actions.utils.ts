import type { TFunction } from 'i18next'
import type { Match } from '@shared/types/match'
import type { Tournament } from '@shared/types/tournament'
import { TournamentFormat } from '@shared/types/tournament-format'
import {
  TournamentPhaseType,
  type TournamentPhase,
} from '@shared/types/tournament-phase'
import {
  getPhaseMatches,
} from '@shared/tournament/phase-completion.utils'

export function getPhaseByType(
  phases: TournamentPhase[],
  phaseType: TournamentPhaseType,
): TournamentPhase | null {
  return phases.find((phase) => phase.phaseType === phaseType) ?? null
}

export function countUnplayedPhaseMatches(phaseId: string, matches: Match[]): number {
  return getPhaseMatches(phaseId, matches).filter(
    (match) =>
      match.status !== 'played' || match.homeGoals === null || match.awayGoals === null,
  ).length
}

function isPreviousPhaseReadyForGeneration(previousPhase: TournamentPhase): boolean {
  return previousPhase.status === 'active' || previousPhase.status === 'completed'
}

export interface GeneratePlayoffsActionState {
  visible: boolean
  enabled: boolean
  hint: string | null
}

export interface GenerateKnockoutActionState {
  visible: boolean
  enabled: boolean
  hint: string | null
}

export function getGeneratePlayoffsActionState(
  tournament: Tournament,
  phases: TournamentPhase[],
  selectedPhase: TournamentPhase | null,
  matches: Match[],
  t: TFunction,
): GeneratePlayoffsActionState {
  if (tournament.format !== TournamentFormat.ROUND_ROBIN_PLAYOFFS) {
    return { visible: false, enabled: false, hint: null }
  }

  if (selectedPhase?.phaseType !== TournamentPhaseType.ROUND_ROBIN) {
    return { visible: false, enabled: false, hint: null }
  }

  const roundRobinPhase = getPhaseByType(phases, TournamentPhaseType.ROUND_ROBIN)
  const playoffPhase = getPhaseByType(phases, TournamentPhaseType.PLAYOFF)

  if (!roundRobinPhase || !playoffPhase) {
    return { visible: false, enabled: false, hint: null }
  }

  if (!isPreviousPhaseReadyForGeneration(roundRobinPhase)) {
    return { visible: false, enabled: false, hint: null }
  }

  if (playoffPhase.status !== 'pending') {
    return { visible: false, enabled: false, hint: null }
  }

  const roundRobinMatches = getPhaseMatches(roundRobinPhase.id, matches)

  if (roundRobinMatches.length === 0) {
    return {
      visible: true,
      enabled: false,
      hint: t('tournaments.phaseActions.hintGenerateRegularSeason'),
    }
  }

  const unplayedCount = countUnplayedPhaseMatches(roundRobinPhase.id, matches)

  if (unplayedCount > 0) {
    return {
      visible: true,
      enabled: false,
      hint: t('tournaments.phaseActions.hintPlayRegularSeason', { count: unplayedCount }),
    }
  }

  if (!tournament.playoffQualifiedCount) {
    return {
      visible: true,
      enabled: false,
      hint: t('tournaments.phaseActions.hintPlayoffNotConfigured'),
    }
  }

  return { visible: true, enabled: true, hint: null }
}

export function getGenerateKnockoutActionState(
  tournament: Tournament,
  phases: TournamentPhase[],
  selectedPhase: TournamentPhase | null,
  matches: Match[],
  t: TFunction,
): GenerateKnockoutActionState {
  if (tournament.format !== TournamentFormat.GROUPS_KNOCKOUT) {
    return { visible: false, enabled: false, hint: null }
  }

  if (selectedPhase?.phaseType !== TournamentPhaseType.GROUP_STAGE) {
    return { visible: false, enabled: false, hint: null }
  }

  const groupStagePhase = getPhaseByType(phases, TournamentPhaseType.GROUP_STAGE)
  const knockoutPhase = getPhaseByType(phases, TournamentPhaseType.KNOCKOUT)

  if (!groupStagePhase || !knockoutPhase) {
    return { visible: false, enabled: false, hint: null }
  }

  if (!isPreviousPhaseReadyForGeneration(groupStagePhase)) {
    return { visible: false, enabled: false, hint: null }
  }

  if (knockoutPhase.status !== 'pending') {
    return { visible: false, enabled: false, hint: null }
  }

  const groupMatches = getPhaseMatches(groupStagePhase.id, matches)

  if (groupMatches.length === 0) {
    return {
      visible: true,
      enabled: false,
      hint: t('tournaments.phaseActions.hintGenerateGroupStage'),
    }
  }

  const unplayedCount = countUnplayedPhaseMatches(groupStagePhase.id, matches)

  if (unplayedCount > 0) {
    return {
      visible: true,
      enabled: false,
      hint: t('tournaments.phaseActions.hintPlayGroupStage', { count: unplayedCount }),
    }
  }

  if (!tournament.playoffQualifiedCount) {
    return {
      visible: true,
      enabled: false,
      hint: t('tournaments.phaseActions.hintQualifiersNotConfigured'),
    }
  }

  return { visible: true, enabled: true, hint: null }
}

export function getKnockoutOnlyStartHint(
  tournament: Tournament,
  matches: Match[],
  t: TFunction,
): string | null {
  if (tournament.format !== TournamentFormat.KNOCKOUT_ONLY) {
    return null
  }

  if (tournament.status !== 'draft') {
    return null
  }

  if (matches.length > 0) {
    return null
  }

  return t('tournaments.phaseActions.knockoutOnlyStartHint')
}
