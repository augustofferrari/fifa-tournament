import type { IpcErrorCode } from './result'

export class ApiError extends Error {
  readonly code: IpcErrorCode

  constructor(code: IpcErrorCode, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}
