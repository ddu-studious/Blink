// ========================================
// 窗口管理器 - 设置/统计等普通窗口
// ========================================

import { app, BrowserWindow, nativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import log from 'electron-log'
import { themeService } from '../services/ThemeService'

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
      this.bringWindowToFront(this.settingsWindow)
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
      themeService.syncThemeToWindow(this.settingsWindow!)
      this.bringWindowToFront(this.settingsWindow!)
    })

    this.settingsWindow.webContents.on('did-finish-load', () => {
      themeService.syncThemeToWindow(this.settingsWindow!)
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
      this.bringWindowToFront(this.dashboardWindow)
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
      themeService.syncThemeToWindow(this.dashboardWindow!)
      this.bringWindowToFront(this.dashboardWindow!)
    })

    this.dashboardWindow.webContents.on('did-finish-load', () => {
      themeService.syncThemeToWindow(this.dashboardWindow!)
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

  /**
   * 将窗口可靠地提到最前面
   *
   * LSUIElement 应用（无 Dock 图标）在 macOS 上 focus() 经常无效，
   * 因为应用本身不在前台激活状态。需要先 app.show()/app.focus()
   * 激活应用，再对窗口执行 show + focus 组合。
   */
  private bringWindowToFront(win: BrowserWindow): void {
    if (process.platform === 'darwin') {
      app.show()
    }
    if (win.isMinimized()) {
      win.restore()
    }
    win.show()
    win.focus()
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
