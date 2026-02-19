// ========================================
// IPC 通信处理器
// ========================================

import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS, ThemeMode, RestScreenMode } from '../types'
import { TimerManager } from '../timer/TimerManager'
import { settingsStore } from '../store/SettingsStore'
import { statsDatabase } from '../store/StatsDatabase'
import { autoLaunchService } from '../services/AutoLaunchService'
import { themeService } from '../services/ThemeService'
import { shortcutService } from '../services/ShortcutService'
import { WorkEndReminder } from '../monitor/WorkEndReminder'
import { WaterReminder } from '../monitor/WaterReminder'
import log from 'electron-log'
import dayjs from 'dayjs'

let onWaterRecordCallback: (() => void) | null = null
let workEndReminderRef: WorkEndReminder | null = null
let waterReminderRef: WaterReminder | null = null

/** 设置喝水记录回调（用于刷新托盘进度） */
export function setWaterRecordCallback(callback: () => void): void {
  onWaterRecordCallback = callback
}

/** 设置下班提醒模块引用 */
export function setWorkEndReminder(reminder: WorkEndReminder): void {
  workEndReminderRef = reminder
}

/** 设置喝水提醒模块引用 */
export function setWaterReminder(reminder: WaterReminder): void {
  waterReminderRef = reminder
}

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

  ipcMain.handle(IPC_CHANNELS.TIMER_TAKE_BREAK_WITH_MODE, (_, { type, mode }: { type: 'mini' | 'long'; mode: RestScreenMode }) => {
    timerManager.takeBreakNow(type, mode)
    return timerManager.getState()
  })

  // ---- 休息控制 ----

  ipcMain.handle(IPC_CHANNELS.BREAK_SKIP, () => {
    timerManager.skipBreak()
    return timerManager.getState()
  })

  ipcMain.handle(IPC_CHANNELS.BREAK_ACTIVITY_DETECTED, () => {
    timerManager.resetBreakCountdown()
    return timerManager.getState()
  })

  // ---- 设置 ----

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settingsStore.getAll()
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_, settings) => {
    settingsStore.update(settings)

    // 同步开机自启动设置
    if (settings.general?.autoLaunch !== undefined) {
      await autoLaunchService.setEnabled(settings.general.autoLaunch)
    }

    // 同步主题切换
    if (settings.general?.theme !== undefined) {
      themeService.applyTheme(settings.general.theme as ThemeMode)
    }

    // 同步全局快捷键
    if (settings.general?.globalShortcuts !== undefined) {
      shortcutService.applyShortcuts()
    }

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

  ipcMain.handle(IPC_CHANNELS.STATS_GET_STREAK, () => {
    return statsDatabase.getStreak()
  })

  // ---- 喝水 ----

  ipcMain.handle(IPC_CHANNELS.WATER_RECORD, (_, { amount, source }) => {
    statsDatabase.addWaterRecord(amount, source || 'manual')
    onWaterRecordCallback?.()
    waterReminderRef?.resetTimer()
    return statsDatabase.getWaterToday()
  })

  ipcMain.handle(IPC_CHANNELS.WATER_GET_TODAY, () => {
    return statsDatabase.getWaterToday()
  })

  ipcMain.handle(IPC_CHANNELS.WATER_GET_RANGE, (_, { startDate, endDate }) => {
    return statsDatabase.getWaterRange(startDate, endDate)
  })

  ipcMain.handle(IPC_CHANNELS.WATER_GET_STREAK, () => {
    const waterSettings = settingsStore.get('water')
    return statsDatabase.getWaterStreak(waterSettings.dailyGoal)
  })

  // ---- 运动 ----

  ipcMain.handle(IPC_CHANNELS.EXERCISE_RECORD, (_, { exerciseType, exerciseName, duration, source }) => {
    const now = dayjs()
    statsDatabase.addExerciseRecord({
      timestamp: now.toISOString(),
      exerciseType,
      exerciseName: exerciseName || undefined,
      duration: duration || 0,
      source: source || 'manual',
      createdDate: now.format('YYYY-MM-DD')
    })
    return statsDatabase.getExerciseToday()
  })

  ipcMain.handle(IPC_CHANNELS.EXERCISE_GET_TODAY, () => {
    return statsDatabase.getExerciseToday()
  })

  ipcMain.handle(IPC_CHANNELS.EXERCISE_GET_RANGE, (_, { startDate, endDate }) => {
    return statsDatabase.getExerciseRange(startDate, endDate)
  })

  ipcMain.handle(IPC_CHANNELS.EXERCISE_GET_STREAK, () => {
    return statsDatabase.getExerciseStreak()
  })

  // ---- 下班提醒 ----

  ipcMain.handle(IPC_CHANNELS.WORK_END_POSTPONE, () => {
    workEndReminderRef?.postpone()
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.WORK_END_DISMISS, () => {
    workEndReminderRef?.dismiss()
    return { success: true }
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
