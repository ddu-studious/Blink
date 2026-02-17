// ========================================
// 全屏休息覆盖窗口管理器 (支持多屏)
// ========================================

import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { BreakType } from '../types'
import log from 'electron-log'

export class OverlayManager {
  private overlayWindows: BrowserWindow[] = []

  /** 显示休息覆盖 (覆盖所有屏幕) */
  show(breakType: BreakType, duration: number): void {
    this.closeAll()

    const displays = screen.getAllDisplays()
    log.info(`[OverlayManager] 创建休息覆盖，屏幕数量: ${displays.length}`)

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
        // 只有主屏幕可聚焦 (显示跳过按钮)
        focusable: index === 0,
        webPreferences: {
          preload: join(__dirname, '../preload/index.mjs'),
          contextIsolation: true,
          sandbox: false
        }
      })

      // 设置窗口层级为 screen-saver (最高优先级)
      win.setAlwaysOnTop(true, 'screen-saver')

      // 加载休息页面
      const query = `breakType=${breakType}&duration=${duration}&isPrimary=${index === 0}`

      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/rest?${query}`)
      } else {
        win.loadFile(join(__dirname, '../renderer/index.html'), {
          hash: `/rest?${query}`
        })
      }

      // macOS 全屏显示
      if (process.platform === 'darwin') {
        win.setSimpleFullScreen(true)
      }

      this.overlayWindows.push(win)
    })
  }

  /** 关闭所有覆盖窗口 */
  closeAll(): void {
    this.overlayWindows.forEach((win) => {
      if (!win.isDestroyed()) {
        // 使用 destroy() 替代 close()，因为 closable:false 会阻止 close()
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
  }
}
