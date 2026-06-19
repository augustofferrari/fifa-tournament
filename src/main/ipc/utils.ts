import type { IpcError, IpcResult } from '@shared/ipc/result'
import { ipcFailure, ipcSuccess } from '@shared/ipc/result'
import { ValidationError } from '@shared/validation'

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError || (error instanceof Error && error.name === 'ValidationError')
}

function toIpcError(error: unknown): IpcError {
  if (isValidationError(error)) {
    return {
      code: error.message.toLowerCase().includes('not found') ? 'NOT_FOUND' : 'VALIDATION',
      message: error.message,
    }
  }

  if (error instanceof Error) {
    return { code: 'INTERNAL', message: error.message }
  }

  return { code: 'INTERNAL', message: 'An unexpected error occurred' }
}

export async function runIpcHandler<T>(handler: () => T | Promise<T>): Promise<IpcResult<T>> {
  try {
    const data = await handler()
    return ipcSuccess(data)
  } catch (error) {
    return ipcFailure(toIpcError(error))
  }
}
