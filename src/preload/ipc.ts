import { ipcRenderer } from 'electron'
import { ApiError } from '@shared/ipc/errors'
import { ALLOWED_INVOKE_CHANNELS, type IpcChannel } from '@shared/ipc/channels'
import type { IpcResult } from '@shared/ipc/result'

function assertAllowedChannel(channel: string): asserts channel is IpcChannel {
  if (!ALLOWED_INVOKE_CHANNELS.has(channel as IpcChannel)) {
    throw new Error(`IPC channel not allowed: ${channel}`)
  }
}

export const ipc = {
  invoke<T>(channel: IpcChannel, ...args: unknown[]): Promise<T> {
    assertAllowedChannel(channel)
    return ipcRenderer.invoke(channel, ...args)
  },

  async invokeResult<T>(channel: IpcChannel, ...args: unknown[]): Promise<T> {
    const result = await this.invoke<IpcResult<T>>(channel, ...args)

    if (!result.success) {
      throw new ApiError(result.error.code, result.error.message)
    }

    return result.data
  },
}
