import { ValidationError } from './errors'

export function assertRequiredField(value: unknown, message: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(message)
  }

  return value.trim()
}

export function assertMinimumCount(
  count: number,
  minimum: number,
  message: string,
): void {
  if (count < minimum) {
    throw new ValidationError(message)
  }
}

export function assertNonNegativeInteger(value: unknown, message: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ValidationError(message)
  }

  return value
}
