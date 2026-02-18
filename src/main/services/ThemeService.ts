// ========================================
// 主题切换服务 - 亮色/暗色/跟随系统
// ========================================

import { nativeTheme, BrowserWindow } from 'electron'
import { ThemeMode } from '../types'
import { settingsStore } from '../store/SettingsStore'
import log from 'electron-log'

class ThemeService {
  private currentMode: ThemeMode = 'system'

  /** 初始化主题服务 */
  init(): void {
    const settings = settingsStore.getAll()
    this.applyTheme(settings.general.theme)

    // 监听系统主题变化 (当设置为 system 时自动跟随)
    nativeTheme.on('updated', () => {
      if (this.currentMode === 'system') {
        this.broadcastTheme()
      }
    })

    log.info('[ThemeService] 初始化完成，当前主题:', settings.general.theme)
  }

  /** 应用主题 */
  applyTheme(mode: ThemeMode): void {
    this.currentMode = mode

    // 设置 Electron nativeTheme
    switch (mode) {
      case 'light':
        nativeTheme.themeSource = 'light'
        break
      case 'dark':
        nativeTheme.themeSource = 'dark'
        break
      case 'system':
      default:
        nativeTheme.themeSource = 'system'
        break
    }

    this.broadcastTheme()
    log.info('[ThemeService] 主题已切换:', mode, '实际:', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
  }

  /** 获取当前是否为暗色模式 */
  isDark(): boolean {
    return nativeTheme.shouldUseDarkColors
  }

  /** 广播主题到所有渲染进程窗口 */
  private broadcastTheme(): void {
    const isDark = this.isDark()
    BrowserWindow.getAllWindows().forEach((win) => {
      this.applyThemeToWindow(win, isDark)
    })
  }

  /** 对单个窗口应用主题 */
  private applyThemeToWindow(win: BrowserWindow, isDark: boolean): void {
    if (win.isDestroyed()) return
    win.webContents.executeJavaScript(`
      if (${isDark}) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    `).catch(() => {
      // 窗口可能尚未加载完成
    })
  }

  /** 对新创建的窗口同步当前主题（在 ready-to-show 或 did-finish-load 时调用） */
  syncThemeToWindow(win: BrowserWindow): void {
    this.applyThemeToWindow(win, this.isDark())
  }
}

export const themeService = new ThemeService()
