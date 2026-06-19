import {
  assertMinimumCount,
  assertRequiredField,
  ValidationError,
} from '@shared/validation'
import { ValidationMessages } from '@shared/validation/messages'

export { ValidationError }

export function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} is required`)
  }

  return value.trim()
}

export function assertPlayerName(value: unknown): string {
  return assertRequiredField(value, ValidationMessages.playerNameRequired)
}

export function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export function nowIsoString(): string {
  return new Date().toISOString()
}
