// ========================================
// 预加载脚本 - 安全桥接主进程 API
// ========================================

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../main/types'

// 青眸 API - 暴露给渲染进程的安全接口
const qingmouAPI = {
  // ---- 计时器 ----
  timer: {
    start: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_START),
    pause: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_PAUSE),
    resume: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESUME),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESET),
    getState: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_STATE),
    takeBreak: (type: 'mini' | 'long') =>
      ipcRenderer.invoke(IPC_CHANNELS.TIMER_TAKE_BREAK, type),
    onStateUpdate: (callback: (state: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, state: unknown) => callback(state)
      ipcRenderer.on(IPC_CHANNELS.TIMER_STATE_UPDATE, handler)
      // 返回清理函数
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TIMER_STATE_UPDATE, handler)
    }
  },

  // ---- 休息 ----
  break: {
    skip: () => ipcRenderer.invoke(IPC_CHANNELS.BREAK_SKIP),
    activityDetected: () => ipcRenderer.invoke(IPC_CHANNELS.BREAK_ACTIVITY_DETECTED)
  },

  // ---- 设置 ----
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    set: (settings: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_RESET)
  },

  // ---- 统计 ----
  stats: {
    getToday: () => ipcRenderer.invoke(IPC_CHANNELS.STATS_GET_TODAY),
    getRange: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.STATS_GET_RANGE, { startDate, endDate }),
    getStreak: () => ipcRenderer.invoke(IPC_CHANNELS.STATS_GET_STREAK)
  },

  // ---- 喝水 ----
  water: {
    record: (amount: number, source: string = 'manual') =>
      ipcRenderer.invoke(IPC_CHANNELS.WATER_RECORD, { amount, source }),
    getToday: () => ipcRenderer.invoke(IPC_CHANNELS.WATER_GET_TODAY),
    getRange: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.WATER_GET_RANGE, { startDate, endDate }),
    getStreak: () => ipcRenderer.invoke(IPC_CHANNELS.WATER_GET_STREAK)
  }
}

// 使用 contextBridge 安全暴露 API
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', qingmouAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = qingmouAPI
}
