import { describe, expect, it } from 'vitest'
import { ValidationError } from '@shared/validation'
import { validateCreateMatchInput } from './match.validation'

describe('validateCreateMatchInput', () => {
  it('requires phaseId for new matches', () => {
    expect(() =>
      validateCreateMatchInput({
        tournamentId: 't1',
        phaseId: '',
        roundNumber: 1,
        homePlayerId: 'p1',
        awayPlayerId: 'p2',
      }),
    ).toThrow(ValidationError)
  })

  it('accepts optional bracket and group fields', () => {
    expect(
      validateCreateMatchInput({
        tournamentId: 't1',
        phaseId: 'phase-1',
        roundNumber: 1,
        homePlayerId: 'p1',
        awayPlayerId: 'p2',
        groupId: 'group-a',
        bracketRound: 'quarterfinal',
        bracketPosition: 2,
      }),
    ).toEqual({
      tournamentId: 't1',
      phaseId: 'phase-1',
      roundNumber: 1,
      homePlayerId: 'p1',
      awayPlayerId: 'p2',
      groupId: 'group-a',
      bracketRound: 'quarterfinal',
      bracketPosition: 2,
    })
  })
})
