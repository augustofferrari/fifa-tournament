import type { IpcErrorCode } from './result'

export class ApiError extends Error {
  readonly code: IpcErrorCode
  readonly i18nKey?: string
  readonly i18nParams?: Record<string, string | number>

  constructor(
    code: IpcErrorCode,
    message: string,
    i18nKey?: string,
    i18nParams?: Record<string, string | number>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.i18nKey = i18nKey
    this.i18nParams = i18nParams
  }
}
