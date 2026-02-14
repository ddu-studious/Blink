// ========================================
// 系统托盘管理器
// ========================================

import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'
import { TimerState, TimerStatus } from '../types'
import log from 'electron-log'

// 托盘菜单操作回调
export interface TrayCallbacks {
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onTakeBreak: () => void
  onSkipToNext: () => void
  onShowSettings: () => void
  onShowDashboard: () => void
  onQuit: () => void
}

export class TrayManager {
  private tray: Tray | null = null
  private callbacks: TrayCallbacks

  constructor(callbacks: TrayCallbacks) {
    this.callbacks = callbacks
  }

  /** 创建系统托盘 */
  init(): void {
    // 创建托盘图标 (使用 16x16 模板图标)
    const iconPath = join(__dirname, '../../resources/icons/tray-icon.png')
    let icon: Electron.NativeImage

    try {
      icon = nativeImage.createFromPath(iconPath)
      // macOS 模板图标
      if (process.platform === 'darwin') {
        icon = icon.resize({ width: 16, height: 16 })
        icon.setTemplateImage(true)
      }
    } catch {
      // 如果图标文件不存在，创建一个简单的默认图标
      icon = nativeImage.createEmpty()
      log.warn('[TrayManager] 托盘图标文件不存在，使用空图标')
    }

    this.tray = new Tray(icon)
    this.tray.setToolTip('青眸 - 护眼提醒')

    this.updateMenu('idle')

    log.info('[TrayManager] 系统托盘已创建')
  }

  /** 根据计时器状态更新菜单 */
  updateMenu(status: TimerStatus): void {
    if (!this.tray) return

    const isRunning = status === 'running'
    const isPaused = status === 'paused'
    const isIdle = status === 'idle'
    const isBreak = status === 'break'

    const menuTemplate: Electron.MenuItemConstructorOptions[] = [
      {
        label: '青眸 护眼提醒',
        enabled: false
      },
      { type: 'separator' },
      // 运行控制
      {
        label: '开始护眼',
        click: () => this.callbacks.onStart(),
        visible: isIdle
      },
      {
        label: '暂停护眼',
        click: () => this.callbacks.onPause(),
        visible: isRunning
      },
      {
        label: '恢复护眼',
        click: () => this.callbacks.onResume(),
        visible: isPaused
      },
      {
        label: '立即休息',
        click: () => this.callbacks.onTakeBreak(),
        enabled: isRunning
      },
      { type: 'separator' },
      {
        label: '统计',
        click: () => this.callbacks.onShowDashboard()
      },
      {
        label: '设置',
        click: () => this.callbacks.onShowSettings()
      },
      { type: 'separator' },
      {
        label: '退出青眸',
        click: () => this.callbacks.onQuit()
      }
    ]

    const contextMenu = Menu.buildFromTemplate(menuTemplate)
    this.tray.setContextMenu(contextMenu)
  }

  /** 更新托盘 tooltip 显示倒计时 */
  updateTooltip(state: TimerState): void {
    if (!this.tray) return

    let tooltip = '青眸'

    switch (state.status) {
      case 'running': {
        const mins = Math.floor(state.miniBreakRemaining / 60)
        const secs = state.miniBreakRemaining % 60
        tooltip = `青眸 - 距下次休息 ${mins}:${secs.toString().padStart(2, '0')}`
        break
      }
      case 'paused':
        tooltip = '青眸 - 已暂停'
        break
      case 'break':
        tooltip = `青眸 - 休息中 (${state.breakRemaining}秒)`
        break
      case 'idle':
        tooltip = '青眸 - 未启动'
        break
    }

    this.tray.setToolTip(tooltip)
  }

  /** 销毁托盘 */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
      log.info('[TrayManager] 系统托盘已销毁')
    }
  }
}
