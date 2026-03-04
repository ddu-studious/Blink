// ========================================
// 青眸 (QingMou) - 主进程入口
// ========================================

import { app, BrowserWindow, ipcMain, Notification, dialog, nativeImage } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { join } from 'path'
import log from 'electron-log'

import { TimerManager } from './timer/TimerManager'
import { TrayManager } from './tray/TrayManager'
import { OverlayManager } from './window/OverlayManager'
import { WindowManager } from './window/WindowManager'
import { PowerMonitorService } from './monitor/PowerMonitor'
import { IdleDetector } from './monitor/IdleDetector'
import { DndDetector } from './monitor/DndDetector'
import { FullscreenDetector } from './monitor/FullscreenDetector'
import { SedentaryDetector } from './monitor/SedentaryDetector'
import { WorkEndReminder } from './monitor/WorkEndReminder'
import { WaterReminder } from './monitor/WaterReminder'
import { StandReminder } from './monitor/StandReminder'
import { PauseReminder } from './monitor/PauseReminder'
import { settingsStore } from './store/SettingsStore'
import { statsDatabase } from './store/StatsDatabase'
import { registerIpcHandlers, broadcastTimerState, setWaterRecordCallback, setWorkEndReminder, setWaterReminder } from './ipc/ipcHandlers'
import { autoLaunchService } from './services/AutoLaunchService'
import { soundService } from './services/SoundService'
import { shortcutService } from './services/ShortcutService'
import { themeService } from './services/ThemeService'
import { BreakType, IPC_CHANNELS, RestScreenMode, TimerState } from './types'
import dayjs from 'dayjs'

// ---- 日志配置 ----
log.transports.file.level = 'info'
log.transports.console.level = 'debug'

// ---- 全局模块实例 ----
let timerManager: TimerManager
let trayManager: TrayManager
let overlayManager: OverlayManager
let windowManager: WindowManager
let powerMonitorService: PowerMonitorService
let idleDetector: IdleDetector
let dndDetector: DndDetector
let fullscreenDetector: FullscreenDetector
let sedentaryDetector: SedentaryDetector
let workEndReminder: WorkEndReminder
let waterReminder: WaterReminder
let standReminder: StandReminder
let pauseReminder: PauseReminder
let timerWatchdog: NodeJS.Timeout | null = null
let dateCheckInterval: NodeJS.Timeout | null = null
let lastCheckedDate: string = dayjs().format('YYYY-MM-DD')

/** 第一阶段：仅创建托盘相关（让菜单栏尽快出现） */
function initTrayFirst(): void {
  statsDatabase.init()
  timerManager = new TimerManager()
  overlayManager = new OverlayManager()
  windowManager = new WindowManager()
  trayManager = new TrayManager({
    onStart: () => timerManager.start(),
    onPause: () => timerManager.pause(),
    onResume: () => timerManager.resume(),
    onTakeBreak: () => timerManager.takeBreakNow('mini'),
    onTakeBreakWithMode: (type, mode) => {
      if (timerManager.getState().status === 'idle') {
        timerManager.start()
      }
      timerManager.takeBreakNow(type, mode)
    },
    onSkipToNext: () => timerManager.skipBreak(),
    onShowSettings: () => windowManager.showSettings(),
    onShowDashboard: () => windowManager.showDashboard(),
    onRecordWater: (amount: number) => {
      statsDatabase.addWaterRecord(amount, 'tray')
      refreshWaterProgress()
      waterReminder?.resetTimer()
    },
    onToggleWaterReminder: () => {
      const waterSettings = settingsStore.get('water')
      const newValue = !waterSettings.independentReminder
      settingsStore.set('water', { ...waterSettings, independentReminder: newValue })
      if (newValue) {
        waterReminder?.start()
      } else {
        waterReminder?.stop()
        waterReminder?.start()
      }
      refreshWaterProgress()
      log.info(`[Main] 喝水定时提醒已${newValue ? '开启' : '关闭'}`)
    },
    onShowAbout: () => {
      // 加载应用图标
      let icon: Electron.NativeImage | undefined
      try {
        const iconPath = join(__dirname, '../resources/icons/icon-128.png')
        icon = nativeImage.createFromPath(iconPath)
        if (icon.isEmpty()) icon = undefined
      } catch {
        // 图标加载失败时不传 icon
      }

      dialog.showMessageBox({
        type: 'info',
        icon,
        title: '关于青眸',
        message: '青眸 (QingMou)',
        detail: `版本: v${app.getVersion()}\n\n基于 20-20-20 法则的智能护眼提醒应用\n\n科学 · 智能 · 美观 · 克制\n\nMade with ❤️ for your eyes`,
        buttons: ['确定']
      })
    },
    onQuit: () => {
      cleanup()
      app.quit()
    }
  })
  trayManager.init()
  log.info('[Main] 托盘已显示，后台继续初始化...')
}

/** 第二阶段：监控、IPC 等（延迟执行，避免阻塞首帧） */
function initModulesDeferred(): void {
  powerMonitorService = new PowerMonitorService()
  powerMonitorService.init()
  idleDetector = new IdleDetector()
  dndDetector = new DndDetector()
  fullscreenDetector = new FullscreenDetector()
  sedentaryDetector = new SedentaryDetector()
  workEndReminder = new WorkEndReminder()
  waterReminder = new WaterReminder()
  standReminder = new StandReminder()
  pauseReminder = new PauseReminder()
  themeService.init()
  registerIpcHandlers(timerManager)
  setWorkEndReminder(workEndReminder)
  setWaterReminder(waterReminder)
  ipcMain.handle(IPC_CHANNELS.WINDOW_OPEN_SETTINGS, () => {
    windowManager.showSettings()
  })
  shortcutService.register({
    onTogglePause: () => {
      const state = timerManager.getState()
      if (state.status === 'running') {
        timerManager.pause()
      } else if (state.status === 'paused') {
        timerManager.resume()
      } else if (state.status === 'idle') {
        timerManager.start()
      }
    },
    onTakeBreak: () => timerManager.takeBreakNow('mini'),
    onSkipBreak: () => timerManager.skipBreak()
  })

  // ---- 事件连接 ----

  // 计时器状态更新 → 广播给渲染进程 + 更新托盘 + 联动独立提醒
  let prevTimerStatus: string = 'idle'
  timerManager.on('state-update', (state: TimerState) => {
    broadcastTimerState(state)
    trayManager.updateTooltip(state)
    trayManager.updateTitle(state) // macOS 菜单栏倒计时显示
    trayManager.updateMenu(state.status)

    // 暂停/恢复时联动独立提醒模块
    if (state.status !== prevTimerStatus) {
      if (state.status === 'paused') {
        waterReminder?.stop()
        standReminder?.stop()
        sedentaryDetector?.stop()
        workEndReminder?.stop()
        // 仅用户手动暂停时启动暂停提醒
        if (timerManager.isManuallyPaused()) {
          pauseReminder?.onPaused()
        }
        log.info('[Main] 护眼已暂停，独立提醒模块已同步暂停')
      } else if (state.status === 'running' && prevTimerStatus === 'paused') {
        waterReminder?.start()
        standReminder?.start()
        sedentaryDetector?.start()
        workEndReminder?.start()
        pauseReminder?.onResumed()
        // 恢复时检测是否跨天，刷新当日数据
        handleDateChangeCheck()
        log.info('[Main] 护眼已恢复，独立提醒模块已同步恢复')
      }
      prevTimerStatus = state.status
    }
  })

  // 休息即将开始 (30秒预告) → 系统通知
  timerManager.on('break-warning', ({ type }: { type: BreakType }) => {
    const settings = settingsStore.getAll()
    // 仅在 notification 或 both 模式下发送预告通知
    // overlay-only 模式下不发通知预告（全屏覆盖本身就是即时提醒）
    if (settings.reminder.notificationMode === 'notification' || settings.reminder.notificationMode === 'both') {
      const title = type === 'mini' ? '青眸 - 短休息即将开始' : '青眸 - 长休息即将开始'
      const body = '30 秒后将进入休息，请保存好当前工作'
      new Notification({ title, body }).show()
    }
  })

  // 休息开始 → 显示覆盖窗口 + 系统通知 + 声音提示
  timerManager.on('break-start', ({ type, duration, forceMode }: { type: BreakType; duration: number; forceMode?: RestScreenMode }) => {
    const settings = settingsStore.getAll()

    if (settings.reminder.notificationMode === 'overlay' || settings.reminder.notificationMode === 'both') {
      overlayManager.show(type, duration, forceMode, () => {
        timerManager.onBreakPageReady()
      })
    } else {
      // 非 overlay 模式，直接开始倒计时
      timerManager.onBreakPageReady()
    }

    if (settings.reminder.notificationMode === 'notification' || settings.reminder.notificationMode === 'both') {
      const title = type === 'mini' ? '青眸 - 短休息' : '青眸 - 长休息'
      const body = type === 'mini' ? '望向远方 20 秒，让眼睛放松一下' : '站起来活动一下身体吧！'
      new Notification({ title, body }).show()
    }

    // 播放休息开始提示音
    soundService.play('break-start')
  })

  // 休息结束 → 关闭覆盖窗口 + 声音提示
  timerManager.on('break-end', () => {
    overlayManager.closeAll()

    // 播放休息结束提示音
    soundService.play('break-end')
  })

  // 电源事件 → 计时器暂停/恢复（独立暂停源）
  powerMonitorService.on('suspend', () => timerManager.handleSuspend())
  powerMonitorService.on('resume', () => timerManager.handleResume())
  powerMonitorService.on('lock-screen', () => timerManager.handleLockScreen())
  powerMonitorService.on('unlock-screen', () => timerManager.handleUnlockScreen())

  // 空闲检测 → 计时器暂停/恢复（已集成媒体活动检测）
  idleDetector.on('idle', (isIdle: boolean) => timerManager.handleIdle(isIdle))

  // 免打扰检测 → 计时器暂停/恢复
  dndDetector.on('dnd-change', (isDnd: boolean) => {
    timerManager.handleDnd(isDnd)
    log.info(`[Main] 免打扰模式${isDnd ? '开启' : '关闭'}`)
  })

  // 全屏应用检测 → 计时器暂停/恢复
  fullscreenDetector.on('fullscreen-change', (isFullscreen: boolean) => {
    timerManager.handleFullscreen(isFullscreen)
    log.info(`[Main] 全屏应用${isFullscreen ? '检测到' : '已退出'}`)
  })

  // 久坐检测 → 显示通知提醒
  sedentaryDetector.on('sedentary', ({ duration }: { duration: number }) => {
    if (duration > 0) {
      log.info(`[Main] 久坐提醒已触发 (连续使用 ${Math.floor(duration / 60)} 分钟)`)
    }
  })

  // 久坐通知点击 → 打开拉伸引导
  sedentaryDetector.on('sedentary-action-requested', () => {
    log.info('[Main] 用户点击久坐通知，触发拉伸引导')
    if (timerManager.getState().status === 'idle') {
      timerManager.start()
    }
    timerManager.takeBreakNow('long', 'stretch')
  })

  // 下班提醒
  workEndReminder.on('work-end', () => {
    log.info('[Main] 下班提醒已触发')
  })

  // 下班通知点击 → 打开正念引导
  workEndReminder.on('work-end-action-requested', () => {
    log.info('[Main] 用户点击下班通知，触发正念引导')
    if (timerManager.getState().status === 'idle') {
      timerManager.start()
    }
    timerManager.takeBreakNow('long', 'mindful')
  })

  // 喝水提醒通知点击 → 打开统计页
  waterReminder.on('water-reminder-clicked', () => {
    windowManager.showDashboard()
  })

  // 喝水通知按钮 "已喝水" → 记录 250ml + 重置计时
  waterReminder.on('water-drink-confirmed', () => {
    statsDatabase.addWaterRecord(250, 'notification')
    waterReminder.resetTimer()
    refreshWaterProgress()
    log.info('[Main] 通知按钮记录喝水 250ml')
  })

  // 站立提醒点击 → 打开拉伸引导
  standReminder.on('stand-reminder-clicked', () => {
    log.info('[Main] 用户点击站立通知，触发拉伸引导')
    if (timerManager.getState().status === 'idle') {
      timerManager.start()
    }
    timerManager.takeBreakNow('long', 'stretch')
  })

  // 暂停护眼提醒 → 用户点击通知恢复护眼
  pauseReminder.on('resume-requested', () => {
    log.info('[Main] 用户通过暂停提醒通知恢复护眼')
    timerManager.resume()
  })

  // 站立通知按钮 "已站立" → 记录运动 + 重置计时
  standReminder.on('stand-confirmed', () => {
    const now = new Date().toISOString()
    statsDatabase.addExerciseRecord({
      timestamp: now,
      exerciseType: 'stand',
      exerciseName: '站立活动',
      duration: 60,
      source: 'notification',
      createdDate: now.split('T')[0]
    })
    log.info('[Main] 通知按钮记录站立活动')
  })

  // 初始化喝水进度 & 注册 IPC 回调
  refreshWaterProgress()
  setWaterRecordCallback(refreshWaterProgress)

  log.info('[Main] 所有模块初始化完成')
}

/** 检测日期变更，跨天时自动刷新所有当日数据 */
function handleDateChangeCheck(): void {
  const today = dayjs().format('YYYY-MM-DD')
  if (today !== lastCheckedDate) {
    log.info(`[Main] 检测到日期变更: ${lastCheckedDate} → ${today}，刷新当日数据`)
    lastCheckedDate = today

    refreshWaterProgress()
    timerManager?.reloadTodayStats()

    log.info('[Main] 跨天数据刷新完成')
  }
}

/** 刷新托盘喝水进度 */
function refreshWaterProgress(): void {
  const waterSettings = settingsStore.get('water')
  trayManager.setWaterEnabled(waterSettings.enabled)
  trayManager.setWaterIndependentReminder(waterSettings.independentReminder)
  if (waterSettings.enabled) {
    const todayWater = statsDatabase.getWaterToday()
    trayManager.updateWaterProgress({
      totalMl: todayWater.totalMl,
      dailyGoal: waterSettings.dailyGoal
    })
    // 更新菜单以反映新进度
    const state = timerManager.getState()
    trayManager.updateMenu(state.status)
    trayManager.updateTooltip(state)
  }
}

/** 初始化开机自启动 */
async function initAutoLaunch(): Promise<void> {
  const settings = settingsStore.getAll()
  await autoLaunchService.setEnabled(settings.general.autoLaunch)
}

/** 清理资源 */
function cleanup(): void {
  if (timerWatchdog) {
    clearInterval(timerWatchdog)
    timerWatchdog = null
  }
  if (dateCheckInterval) {
    clearInterval(dateCheckInterval)
    dateCheckInterval = null
  }
  timerManager?.destroy()
  trayManager?.destroy()
  overlayManager?.destroy()
  windowManager?.destroy()
  powerMonitorService?.destroy()
  idleDetector?.destroy()
  dndDetector?.destroy()
  fullscreenDetector?.destroy()
  sedentaryDetector?.destroy()
  workEndReminder?.destroy()
  waterReminder?.destroy()
  standReminder?.destroy()
  pauseReminder?.destroy()
  shortcutService?.destroy()
  statsDatabase?.close()
  log.info('[Main] 资源清理完成')
}

// ========================================
// 应用生命周期
// ========================================

app.whenReady().then(async () => {
  // 设置应用 ID (Windows)
  electronApp.setAppUserModelId('com.qingmou.app')

  // macOS: 设置 Dock 图标 (dev 模式下 Electron 默认图标不是应用图标)
  if (process.platform === 'darwin' && app.dock) {
    try {
      const dockIconPath = join(__dirname, '../resources/icons/icon.png')
      const dockIcon = nativeImage.createFromPath(dockIconPath)
      if (!dockIcon.isEmpty()) {
        app.dock.setIcon(dockIcon)
      }
    } catch {
      // 图标不存在时忽略
    }
  }

  // 开发模式下 F12 打开 DevTools
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 先显示托盘（菜单栏尽快出现），其余初始化放到下一帧
  initTrayFirst()
  setImmediate(async () => {
    initModulesDeferred()
    idleDetector.start()
    dndDetector.start()
    fullscreenDetector.start()
    sedentaryDetector.start()
    workEndReminder.start()
    waterReminder.start()
    standReminder.start()
    await initAutoLaunch()
    const settings = settingsStore.getAll()
    if (settings.firstRun) {
      windowManager.showSettings()
      settingsStore.markFirstRunDone()
    }
    timerManager.start()
    timerWatchdog = setInterval(() => {
      timerManager.ensureRunning()
    }, 60000)
    dateCheckInterval = setInterval(() => {
      handleDateChangeCheck()
    }, 60000)
    log.info('[Main] 青眸已启动')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.showSettings()
    }
  })
})

// 关闭所有窗口时不退出 (托盘应用行为)
app.on('window-all-closed', () => {
  // 护眼应用不在关闭窗口时退出，保持后台运行
  // 只有通过托盘菜单的"退出"才真正退出
})

// 应用退出前清理
app.on('before-quit', () => {
  cleanup()
})
