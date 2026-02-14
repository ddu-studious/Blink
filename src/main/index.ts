// ========================================
// 青眸 (QingMou) - 主进程入口
// ========================================

import { app, BrowserWindow, Notification } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import log from 'electron-log'

import { TimerManager } from './timer/TimerManager'
import { TrayManager } from './tray/TrayManager'
import { OverlayManager } from './window/OverlayManager'
import { WindowManager } from './window/WindowManager'
import { PowerMonitorService } from './monitor/PowerMonitor'
import { IdleDetector } from './monitor/IdleDetector'
import { settingsStore } from './store/SettingsStore'
import { statsDatabase } from './store/StatsDatabase'
import { registerIpcHandlers, broadcastTimerState } from './ipc/ipcHandlers'
import { BreakType, TimerState } from './types'

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

/** 初始化所有模块 */
function initModules(): void {
  // 1. 初始化数据库
  statsDatabase.init()

  // 2. 初始化计时器
  timerManager = new TimerManager()

  // 3. 初始化覆盖窗口管理器
  overlayManager = new OverlayManager()

  // 4. 初始化普通窗口管理器
  windowManager = new WindowManager()

  // 5. 初始化系统托盘
  trayManager = new TrayManager({
    onStart: () => timerManager.start(),
    onPause: () => timerManager.pause(),
    onResume: () => timerManager.resume(),
    onTakeBreak: () => timerManager.takeBreakNow('mini'),
    onSkipToNext: () => timerManager.skipBreak(),
    onShowSettings: () => windowManager.showSettings(),
    onShowDashboard: () => windowManager.showDashboard(),
    onQuit: () => {
      cleanup()
      app.quit()
    }
  })
  trayManager.init()

  // 6. 初始化电源监控
  powerMonitorService = new PowerMonitorService()
  powerMonitorService.init()

  // 7. 初始化空闲检测
  idleDetector = new IdleDetector()

  // 8. 注册 IPC 处理器
  registerIpcHandlers(timerManager)

  // ---- 事件连接 ----

  // 计时器状态更新 → 广播给渲染进程 + 更新托盘
  timerManager.on('state-update', (state: TimerState) => {
    broadcastTimerState(state)
    trayManager.updateTooltip(state)
    trayManager.updateMenu(state.status)
  })

  // 休息开始 → 显示覆盖窗口 + 系统通知
  timerManager.on('break-start', ({ type, duration }: { type: BreakType; duration: number }) => {
    const settings = settingsStore.getAll()

    if (settings.reminder.notificationMode === 'overlay' || settings.reminder.notificationMode === 'both') {
      overlayManager.show(type, duration)
    }

    if (settings.reminder.notificationMode === 'notification' || settings.reminder.notificationMode === 'both') {
      const title = type === 'mini' ? '青眸 - 短休息' : '青眸 - 长休息'
      const body = type === 'mini' ? '望向远方 20 秒，让眼睛放松一下' : '站起来活动一下身体吧！'
      new Notification({ title, body }).show()
    }
  })

  // 休息结束 → 关闭覆盖窗口
  timerManager.on('break-end', () => {
    overlayManager.closeAll()
  })

  // 电源事件 → 计时器暂停/恢复
  powerMonitorService.on('suspend', () => timerManager.handleSuspend())
  powerMonitorService.on('resume', () => timerManager.handleResume())
  powerMonitorService.on('lock-screen', () => timerManager.handleSuspend())
  powerMonitorService.on('unlock-screen', () => timerManager.handleResume())

  // 空闲检测 → 计时器暂停/恢复
  idleDetector.on('idle', (isIdle: boolean) => timerManager.handleIdle(isIdle))

  log.info('[Main] 所有模块初始化完成')
}

/** 清理资源 */
function cleanup(): void {
  timerManager?.destroy()
  trayManager?.destroy()
  overlayManager?.destroy()
  windowManager?.destroy()
  powerMonitorService?.destroy()
  idleDetector?.destroy()
  statsDatabase?.close()
  log.info('[Main] 资源清理完成')
}

// ========================================
// 应用生命周期
// ========================================

app.whenReady().then(() => {
  // 设置应用 ID (Windows)
  electronApp.setAppUserModelId('com.qingmou.app')

  // 开发模式下 F12 打开 DevTools
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化所有模块
  initModules()

  // 启动空闲检测
  idleDetector.start()

  // 首次运行：打开设置窗口引导用户
  const settings = settingsStore.getAll()
  if (settings.firstRun) {
    windowManager.showSettings()
    settingsStore.markFirstRunDone()
  }

  // 自动开始计时
  timerManager.start()

  log.info('[Main] 青眸已启动')

  // macOS: 点击 Dock 图标重新创建窗口
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
