import type { IpcError, IpcResult } from '@shared/ipc/result'
import { ipcFailure, ipcSuccess } from '@shared/ipc/result'
import { translate } from '@shared/i18n'
import { ValidationError } from '@shared/validation'

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError || (error instanceof Error && error.name === 'ValidationError')
}

function toIpcError(error: unknown): IpcError {
  if (isValidationError(error)) {
    return {
      code: error.message.toLowerCase().includes('not found') ? 'NOT_FOUND' : 'VALIDATION',
      message: error.message,
      i18nKey: error.i18nKey,
      i18nParams: error.i18nParams,
    }
  }

  if (error instanceof Error) {
    return { code: 'INTERNAL', message: error.message }
  }

  return {
    code: 'INTERNAL',
    message: translate('errors.unexpectedError', 'en'),
    i18nKey: 'errors.unexpectedError',
  }
}

export async function runIpcHandler<T>(handler: () => T | Promise<T>): Promise<IpcResult<T>> {
  try {
    const data = await handler()
    return ipcSuccess(data)
  } catch (error) {
    return ipcFailure(toIpcError(error))
  }
}
