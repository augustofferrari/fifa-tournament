import { describe, expect, it } from 'vitest'
import { TournamentFormat } from '@shared/types/tournament-format'
import { ValidationError } from './errors'
import {
  getMinimumPlayersForFormat,
  validateTournamentFormatPlayerRules,
} from './tournament-format-rules'
import { validateTournamentFormatConfig } from './tournament-format'

describe('getMinimumPlayersForFormat', () => {
  it('returns format-specific minimum player counts', () => {
    expect(getMinimumPlayersForFormat(TournamentFormat.ROUND_ROBIN)).toBe(2)
    expect(getMinimumPlayersForFormat(TournamentFormat.ROUND_ROBIN_PLAYOFFS)).toBe(3)
    expect(getMinimumPlayersForFormat(TournamentFormat.GROUPS_KNOCKOUT)).toBe(4)
    expect(getMinimumPlayersForFormat(TournamentFormat.KNOCKOUT_ONLY)).toBe(2)
  })
})

describe('validateTournamentFormatPlayerRules', () => {
  it('requires at least 3 players for round robin plus playoffs', () => {
    expect(() =>
      validateTournamentFormatPlayerRules(
        TournamentFormat.ROUND_ROBIN_PLAYOFFS,
        { playoffQualifiedCount: 2, groupCount: null, playersPerGroup: null },
        2,
      ),
    ).toThrow('requires at least 3 players')
  })

  it('rejects playoffQualifiedCount above player count', () => {
    expect(() =>
      validateTournamentFormatPlayerRules(
        TournamentFormat.ROUND_ROBIN_PLAYOFFS,
        { playoffQualifiedCount: 4, groupCount: null, playersPerGroup: null },
        3,
      ),
    ).toThrow('playoffQualifiedCount cannot exceed player count')
  })

  it('requires at least 4 players for groups plus knockout', () => {
    expect(() =>
      validateTournamentFormatPlayerRules(
        TournamentFormat.GROUPS_KNOCKOUT,
        { playoffQualifiedCount: 2, groupCount: 2, playersPerGroup: 2 },
        3,
      ),
    ).toThrow('requires at least 4 players')
  })

  it('allows knockout-only tournaments with non power-of-two player counts', () => {
    expect(() =>
      validateTournamentFormatPlayerRules(
        TournamentFormat.KNOCKOUT_ONLY,
        { playoffQualifiedCount: null, groupCount: null, playersPerGroup: null },
        5,
      ),
    ).not.toThrow()
  })
})

describe('validateTournamentFormatConfig strict rules', () => {
  it('requires supported playoffQualifiedCount values', () => {
    expect(() =>
      validateTournamentFormatConfig({
        format: TournamentFormat.ROUND_ROBIN_PLAYOFFS,
        playoffQualifiedCount: 3,
      }),
    ).toThrow('playoffQualifiedCount must be one of 2, 4, 8, 16')
  })

  it('requires groupCount of at least 2 for groups plus knockout', () => {
    expect(() =>
      validateTournamentFormatConfig({
        format: TournamentFormat.GROUPS_KNOCKOUT,
        groupCount: 1,
        playersPerGroup: 4,
        playoffQualifiedCount: 2,
      }),
    ).toThrow('groupCount must be at least 2')
  })

  it('requires total qualifiers to produce a valid knockout bracket', () => {
    expect(() =>
      validateTournamentFormatConfig({
        format: TournamentFormat.GROUPS_KNOCKOUT,
        groupCount: 3,
        playersPerGroup: 4,
        playoffQualifiedCount: 2,
      }),
    ).toThrow('Group count must be even')
  })

  it('accepts valid groups plus knockout configuration', () => {
    expect(
      validateTournamentFormatConfig({
        format: TournamentFormat.GROUPS_KNOCKOUT,
        groupCount: 4,
        playersPerGroup: 4,
        playoffQualifiedCount: 2,
      }),
    ).toMatchObject({
      groupCount: 4,
      playersPerGroup: 4,
      playoffQualifiedCount: 2,
    })
  })
})

describe('validateTournamentFormatConfig existing cases', () => {
  it('defaults to round robin when format is omitted', () => {
    expect(validateTournamentFormatConfig({})).toEqual(
      expect.objectContaining({ format: TournamentFormat.ROUND_ROBIN }),
    )
  })

  it('rejects invalid formats', () => {
    expect(() => validateTournamentFormatConfig({ format: 'INVALID' })).toThrow(ValidationError)
  })
})
