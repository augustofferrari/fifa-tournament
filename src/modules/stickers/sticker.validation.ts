import { ValidationError } from '@shared/validation'

export { ValidationError }

export function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} is required`)
  }

  return value.trim()
}

export function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export function normalizeOptionalRating(value: number | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new ValidationError('Rating must be a non-negative integer.')
  }

  return value
}

export function nowIsoString(): string {
  return new Date().toISOString()
}
