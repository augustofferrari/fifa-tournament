import { contextBridge } from 'electron'
import { createApi } from './api'

contextBridge.exposeInMainWorld('api', createApi())
