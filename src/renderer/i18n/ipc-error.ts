import type { TFunction } from 'i18next'
import { ApiError } from '@shared/ipc/errors'
import type { IpcError } from '@shared/ipc/result'

export function translateIpcError(error: IpcError, t: TFunction): string {
  if (error.i18nKey) {
    return t(error.i18nKey, error.i18nParams ?? {})
  }

  return error.message
}

export function getErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    if (error.i18nKey) {
      return t(error.i18nKey, error.i18nParams ?? {})
    }

    return error.message
  }

  if (error && typeof error === 'object' && 'i18nKey' in error) {
    const ipcError = error as IpcError
    return translateIpcError(ipcError, t)
  }

  if (error instanceof Error) {
    return error.message
  }

  return t('common.somethingWentWrong')
}
