export type IpcErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'INTERNAL'

export interface IpcError {
  code: IpcErrorCode
  message: string
  i18nKey?: string
  i18nParams?: Record<string, string | number>
}

export interface IpcSuccess<T> {
  success: true
  data: T
}

export interface IpcFailure {
  success: false
  error: IpcError
}

export type IpcResult<T> = IpcSuccess<T> | IpcFailure

export function ipcSuccess<T>(data: T): IpcSuccess<T> {
  return { success: true, data }
}

export function ipcFailure(error: IpcError): IpcFailure {
  return { success: false, error }
}
