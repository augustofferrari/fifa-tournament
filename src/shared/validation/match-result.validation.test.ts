import { describe, expect, it } from 'vitest'
import { TournamentPhaseType } from '@shared/types/tournament-phase'
import { translate } from '@shared/i18n'
import { ValidationError } from './errors'
import { ValidationMessages } from './messages'
import {
  assertTournamentAllowsResultEditing,
  isMatchResultsReadOnly,
  phaseAllowsDraws,
  validateMatchResult,
  validateMatchResultForPhase,
  validateMatchResultGoals,
} from './match-result.validation'

describe('phaseAllowsDraws', () => {
  it('allows draws in round robin and group stage', () => {
    expect(phaseAllowsDraws(TournamentPhaseType.ROUND_ROBIN)).toBe(true)
    expect(phaseAllowsDraws(TournamentPhaseType.GROUP_STAGE)).toBe(true)
  })

  it('disallows draws in playoff and knockout phases', () => {
    expect(phaseAllowsDraws(TournamentPhaseType.PLAYOFF)).toBe(false)
    expect(phaseAllowsDraws(TournamentPhaseType.KNOCKOUT)).toBe(false)
  })
})

describe('validateMatchResultGoals', () => {
  it('accepts zero and positive integer goals', () => {
    expect(validateMatchResultGoals(0, 3)).toEqual({ homeGoals: 0, awayGoals: 3 })
  })

  it('rejects negative and non-integer goals', () => {
    expect(() => validateMatchResultGoals(-1, 0)).toThrow(
      translate(ValidationMessages.goalsCannotBeNegative, 'en'),
    )
    expect(() => validateMatchResultGoals(1.5, 0)).toThrow(
      translate(ValidationMessages.goalsCannotBeNegative, 'en'),
    )
  })
})

describe('validateMatchResultForPhase', () => {
  it('allows draws in round robin', () => {
    expect(() =>
      validateMatchResultForPhase(TournamentPhaseType.ROUND_ROBIN, 1, 1),
    ).not.toThrow()
  })

  it('rejects draws in knockout phases', () => {
    expect(() =>
      validateMatchResultForPhase(TournamentPhaseType.KNOCKOUT, 2, 2),
    ).toThrow(ValidationError)
    expect(() =>
      validateMatchResultForPhase(TournamentPhaseType.PLAYOFF, 0, 0),
    ).toThrow(translate(ValidationMessages.knockoutRequiresWinner, 'en'))
  })
})

describe('validateMatchResult', () => {
  it('combines goal and phase validation', () => {
    expect(
      validateMatchResult(TournamentPhaseType.GROUP_STAGE, 2, 2),
    ).toEqual({ homeGoals: 2, awayGoals: 2 })
  })
})

describe('finished tournament result editing', () => {
  it('blocks editing when finished and locked', () => {
    expect(() =>
      assertTournamentAllowsResultEditing({ status: 'finished', resultsUnlocked: false }),
    ).toThrow(translate(ValidationMessages.finishedTournamentResultsLocked, 'en'))
  })

  it('allows editing when finished and unlocked', () => {
    expect(() =>
      assertTournamentAllowsResultEditing({ status: 'finished', resultsUnlocked: true }),
    ).not.toThrow()
  })

  it('marks finished locked tournaments as read-only regardless of phase status', () => {
    expect(
      isMatchResultsReadOnly(
        { status: 'finished', resultsUnlocked: false },
        { status: 'active' },
      ),
    ).toBe(true)
  })

  it('allows editing all phases when finished and unlocked', () => {
    expect(
      isMatchResultsReadOnly(
        { status: 'finished', resultsUnlocked: true },
        { status: 'completed' },
      ),
    ).toBe(false)
  })

  it('keeps non-active phases read-only while the tournament is active', () => {
    expect(
      isMatchResultsReadOnly(
        { status: 'active', resultsUnlocked: false },
        { status: 'completed' },
      ),
    ).toBe(true)
  })
})
