// ========================================
// 窗口管理器 - 设置/统计等普通窗口
// ========================================

import { BrowserWindow, nativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import log from 'electron-log'

/** 获取应用图标 (Linux/Windows 窗口需要) */
function getAppIcon(): Electron.NativeImage | undefined {
  try {
    const iconPath = join(__dirname, '../../resources/icons/icon.png')
    const icon = nativeImage.createFromPath(iconPath)
    return icon.isEmpty() ? undefined : icon
  } catch {
    return undefined
  }
}

export class WindowManager {
  private settingsWindow: BrowserWindow | null = null
  private dashboardWindow: BrowserWindow | null = null

  /** 显示设置窗口 */
  showSettings(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus()
      return
    }

    this.settingsWindow = new BrowserWindow({
      width: 740,
      height: 560,
      title: '青眸 - 设置',
      icon: getAppIcon(),
      show: false,
      autoHideMenuBar: true,
      resizable: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        contextIsolation: true,
        sandbox: false
      }
    })

    this.settingsWindow.on('ready-to-show', () => {
      this.settingsWindow!.show()
    })

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.settingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/settings`)
    } else {
      this.settingsWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: '/settings'
      })
    }

    log.info('[WindowManager] 设置窗口已打开')
  }

  /** 显示统计仪表盘窗口 */
  showDashboard(): void {
    if (this.dashboardWindow && !this.dashboardWindow.isDestroyed()) {
      this.dashboardWindow.focus()
      return
    }

    this.dashboardWindow = new BrowserWindow({
      width: 800,
      height: 600,
      title: '青眸 - 统计',
      icon: getAppIcon(),
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        contextIsolation: true,
        sandbox: false
      }
    })

    this.dashboardWindow.on('ready-to-show', () => {
      this.dashboardWindow!.show()
    })

    this.dashboardWindow.on('closed', () => {
      this.dashboardWindow = null
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.dashboardWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/dashboard`)
    } else {
      this.dashboardWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: '/dashboard'
      })
    }

    log.info('[WindowManager] 统计窗口已打开')
  }

  /** 关闭所有窗口 */
  closeAll(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.close()
    }
    if (this.dashboardWindow && !this.dashboardWindow.isDestroyed()) {
      this.dashboardWindow.close()
    }
  }

  /** 销毁 */
  destroy(): void {
    this.closeAll()
  }
}
