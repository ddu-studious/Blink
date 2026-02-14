// ========================================
// IPC 通信处理器
// ========================================

import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../types'
import { TimerManager } from '../timer/TimerManager'
import { settingsStore } from '../store/SettingsStore'
import { statsDatabase } from '../store/StatsDatabase'
import log from 'electron-log'

/** 注册所有 IPC 处理器 */
export function registerIpcHandlers(timerManager: TimerManager): void {
  // ---- 计时器控制 ----

  ipcMain.handle(IPC_CHANNELS.TIMER_START, () => {
    timerManager.start()
    return timerManager.getState()
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_PAUSE, () => {
    timerManager.pause()
    return timerManager.getState()
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_RESUME, () => {
    timerManager.resume()
    return timerManager.getState()
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_RESET, () => {
    timerManager.stop()
    timerManager.start()
    return timerManager.getState()
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_STATE, () => {
    return timerManager.getState()
  })

  ipcMain.handle(IPC_CHANNELS.TIMER_TAKE_BREAK, (_, type: 'mini' | 'long') => {
    timerManager.takeBreakNow(type)
    return timerManager.getState()
  })

  // ---- 休息控制 ----

  ipcMain.handle(IPC_CHANNELS.BREAK_SKIP, () => {
    timerManager.skipBreak()
    return timerManager.getState()
  })

  // ---- 设置 ----

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settingsStore.getAll()
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_, settings) => {
    settingsStore.update(settings)
    return settingsStore.getAll()
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, () => {
    settingsStore.reset()
    return settingsStore.getAll()
  })

  // ---- 统计 ----

  ipcMain.handle(IPC_CHANNELS.STATS_GET_TODAY, () => {
    return statsDatabase.getTodayStats()
  })

  ipcMain.handle(IPC_CHANNELS.STATS_GET_RANGE, (_, { startDate, endDate }) => {
    return statsDatabase.getStatsRange(startDate, endDate)
  })

  log.info('[IPC] 所有 IPC 处理器已注册')
}

/** 向所有渲染进程广播计时器状态 */
export function broadcastTimerState(state: unknown): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.TIMER_STATE_UPDATE, state)
    }
  })
}
