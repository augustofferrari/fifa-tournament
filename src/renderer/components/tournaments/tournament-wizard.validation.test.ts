import { describe, expect, it } from 'vitest'
import { TournamentFormat } from '@shared/types/tournament-format'
import {
  buildFormatConfigInput,
  validateWizardFormatConfig,
  type TournamentWizardState,
} from './tournament-wizard.validation'

function createWizardState(overrides: Partial<TournamentWizardState> = {}): TournamentWizardState {
  return {
    name: 'Test Cup',
    playerIds: ['p1', 'p2', 'p3', 'p4'],
    format: TournamentFormat.ROUND_ROBIN,
    playoffQualifiedCount: '4',
    groupCount: '2',
    qualifiersPerGroup: '2',
    ...overrides,
  }
}

describe('buildFormatConfigInput', () => {
  it('does not send playoff fields for round robin only tournaments', () => {
    expect(buildFormatConfigInput(createWizardState())).toEqual({
      format: TournamentFormat.ROUND_ROBIN,
    })
  })

  it('sends playoff qualification for round robin plus playoffs', () => {
    expect(
      buildFormatConfigInput(
        createWizardState({ format: TournamentFormat.ROUND_ROBIN_PLAYOFFS }),
      ),
    ).toEqual({
      format: TournamentFormat.ROUND_ROBIN_PLAYOFFS,
      playoffQualifiedCount: '4',
    })
  })
})

describe('validateWizardFormatConfig', () => {
  it('accepts round robin only configuration', () => {
    expect(validateWizardFormatConfig(createWizardState())).toEqual([])
  })
})
