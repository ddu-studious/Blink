// ========================================
// 青眸 (QingMou) - 主进程入口
// ========================================

import { app, BrowserWindow, Notification, dialog, nativeImage } from 'electron'
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
import { settingsStore } from './store/SettingsStore'
import { statsDatabase } from './store/StatsDatabase'
import { registerIpcHandlers, broadcastTimerState } from './ipc/ipcHandlers'
import { autoLaunchService } from './services/AutoLaunchService'
import { soundService } from './services/SoundService'
import { shortcutService } from './services/ShortcutService'
import { themeService } from './services/ThemeService'
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
let dndDetector: DndDetector
let fullscreenDetector: FullscreenDetector

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

  // 6. 初始化电源监控
  powerMonitorService = new PowerMonitorService()
  powerMonitorService.init()

  // 7. 初始化空闲检测
  idleDetector = new IdleDetector()

  // 8. 初始化免打扰检测
  dndDetector = new DndDetector()

  // 8.5 初始化全屏应用检测
  fullscreenDetector = new FullscreenDetector()

  // 9. 初始化主题服务
  themeService.init()

  // 10. 注册 IPC 处理器
  registerIpcHandlers(timerManager)

  // 10. 注册全局快捷键
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

  // 计时器状态更新 → 广播给渲染进程 + 更新托盘
  timerManager.on('state-update', (state: TimerState) => {
    broadcastTimerState(state)
    trayManager.updateTooltip(state)
    trayManager.updateTitle(state) // macOS 菜单栏倒计时显示
    trayManager.updateMenu(state.status)
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

    // 播放休息开始提示音
    soundService.play('break-start')
  })

  // 休息结束 → 关闭覆盖窗口 + 声音提示
  timerManager.on('break-end', () => {
    overlayManager.closeAll()

    // 播放休息结束提示音
    soundService.play('break-end')
  })

  // 电源事件 → 计时器暂停/恢复
  powerMonitorService.on('suspend', () => timerManager.handleSuspend())
  powerMonitorService.on('resume', () => timerManager.handleResume())
  powerMonitorService.on('lock-screen', () => timerManager.handleSuspend())
  powerMonitorService.on('unlock-screen', () => timerManager.handleResume())

  // 空闲检测 → 计时器暂停/恢复
  idleDetector.on('idle', (isIdle: boolean) => timerManager.handleIdle(isIdle))

  // 免打扰检测 → 计时器暂停/恢复
  dndDetector.on('dnd-change', (isDnd: boolean) => {
    if (isDnd) {
      timerManager.handleSuspend()
      log.info('[Main] 免打扰模式开启，暂停计时')
    } else {
      timerManager.handleResume()
      log.info('[Main] 免打扰模式关闭，恢复计时')
    }
  })

  // 全屏应用检测 → 计时器暂停/恢复
  fullscreenDetector.on('fullscreen-change', (isFullscreen: boolean) => {
    if (isFullscreen) {
      timerManager.handleSuspend()
      log.info('[Main] 检测到全屏应用，暂停计时')
    } else {
      timerManager.handleResume()
      log.info('[Main] 全屏应用退出，恢复计时')
    }
  })

  log.info('[Main] 所有模块初始化完成')
}

/** 初始化开机自启动 */
async function initAutoLaunch(): Promise<void> {
  const settings = settingsStore.getAll()
  await autoLaunchService.setEnabled(settings.general.autoLaunch)
}

/** 清理资源 */
function cleanup(): void {
  timerManager?.destroy()
  trayManager?.destroy()
  overlayManager?.destroy()
  windowManager?.destroy()
  powerMonitorService?.destroy()
  idleDetector?.destroy()
  dndDetector?.destroy()
  fullscreenDetector?.destroy()
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

  // 开发模式下 F12 打开 DevTools
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化所有模块
  initModules()

  // 启动空闲检测
  idleDetector.start()

  // 启动免打扰检测
  dndDetector.start()

  // 启动全屏应用检测
  fullscreenDetector.start()

  // 初始化开机自启动
  await initAutoLaunch()

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
