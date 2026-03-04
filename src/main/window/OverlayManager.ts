// ========================================
// 全屏休息覆盖窗口管理器 (支持多屏)
// ========================================

import { BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { BreakType, IPC_CHANNELS, RestScreenMode } from '../types'
import log from 'electron-log'

export class OverlayManager {
  private overlayWindows: BrowserWindow[] = []
  private onReadyCallback: (() => void) | null = null
  private readyTimeout: NodeJS.Timeout | null = null

  constructor() {
    ipcMain.handle(IPC_CHANNELS.BREAK_PAGE_READY, (event) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (win && this.overlayWindows.includes(win)) {
        this.handlePageReady()
      }
    })
  }

  /** 显示休息覆盖 (覆盖所有屏幕) */
  show(breakType: BreakType, duration: number, forceMode?: RestScreenMode, onReady?: () => void): void {
    this.closeAll()

    this.onReadyCallback = onReady || null

    const displays = screen.getAllDisplays()
    log.info(`[OverlayManager] 创建休息覆盖，屏幕数量: ${displays.length}${forceMode ? `，强制模式: ${forceMode}` : ''}`)

    displays.forEach((display, index) => {
      const win = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        fullscreen: true,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        minimizable: false,
        maximizable: false,
        closable: false,
        focusable: index === 0,
        show: true,
        webPreferences: {
          preload: join(__dirname, '../preload/index.mjs'),
          contextIsolation: true,
          sandbox: false,
          backgroundThrottling: false
        }
      })

      win.setAlwaysOnTop(true, 'screen-saver')

      let query = `breakType=${breakType}&duration=${duration}&isPrimary=${index === 0}`
      if (forceMode) {
        query += `&forceMode=${forceMode}`
      }

      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/rest?${query}`)
      } else {
        win.loadFile(join(__dirname, '../renderer/index.html'), {
          hash: `/rest?${query}`
        })
      }

      if (process.platform === 'darwin') {
        win.setSimpleFullScreen(true)
      }

      this.overlayWindows.push(win)
    })

    // 安全超时：3 秒后无论页面是否就绪都强制显示，防止卡死
    this.readyTimeout = setTimeout(() => {
      this.readyTimeout = null
      if (this.overlayWindows.length > 0) {
        log.warn('[OverlayManager] 页面就绪超时，强制显示窗口')
        this.showAllWindows()
      }
    }, 3000)
  }

  /** 页面就绪时触发回调（窗口已立即显示，此处仅触发倒计时等） */
  private handlePageReady(): void {
    if (this.readyTimeout) {
      clearTimeout(this.readyTimeout)
      this.readyTimeout = null
    }
    if (this.onReadyCallback) {
      this.onReadyCallback()
      this.onReadyCallback = null
    }
    log.info('[OverlayManager] 休息页面已就绪')
  }

  /** 显示所有覆盖窗口并触发就绪回调（创建时已 show: true，此处仅用于超时兜底） */
  private showAllWindows(): void {
    this.overlayWindows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.show()
      }
    })
    if (this.onReadyCallback) {
      this.onReadyCallback()
      this.onReadyCallback = null
    }
    log.info('[OverlayManager] 休息窗口已显示')
  }

  /** 关闭所有覆盖窗口 */
  closeAll(): void {
    if (this.readyTimeout) {
      clearTimeout(this.readyTimeout)
      this.readyTimeout = null
    }
    this.onReadyCallback = null
    this.overlayWindows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.destroy()
      }
    })
    this.overlayWindows = []
    log.info('[OverlayManager] 所有覆盖窗口已关闭')
  }

  /** 是否有覆盖窗口正在显示 */
  isShowing(): boolean {
    return this.overlayWindows.length > 0 && this.overlayWindows.some((w) => !w.isDestroyed())
  }

  /** 销毁 */
  destroy(): void {
    this.closeAll()
    ipcMain.removeHandler(IPC_CHANNELS.BREAK_PAGE_READY)
  }
}
