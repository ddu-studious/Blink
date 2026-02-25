// ========================================
// 全局快捷键服务 - 支持自定义快捷键
// ========================================

import { globalShortcut } from 'electron'
import { ShortcutSettings } from '../types'
import { settingsStore } from '../store/SettingsStore'
import log from 'electron-log'

export interface ShortcutCallbacks {
  onTogglePause: () => void
  onTakeBreak: () => void
  onSkipBreak: () => void
}

export class ShortcutService {
  private registered = false
  private callbacks: ShortcutCallbacks | null = null

  /** 注册全局快捷键 */
  register(callbacks: ShortcutCallbacks): void {
    this.callbacks = callbacks
    this.applyShortcuts()
  }

  /** 从设置读取快捷键并注册 */
  applyShortcuts(): void {
    if (!this.callbacks) return
    if (this.registered) this.unregister()

    const settings = settingsStore.getAll()

    if (!settings.general.shortcutsEnabled) {
      log.info('[ShortcutService] 全局快捷键已禁用，跳过注册')
      return
    }

    const shortcuts = settings.general.globalShortcuts

    try {
      // 暂停/恢复护眼
      if (shortcuts.togglePause) {
        const success = globalShortcut.register(shortcuts.togglePause, () => {
          log.info('[Shortcut] 切换暂停/恢复')
          this.callbacks!.onTogglePause()
        })
        if (!success) {
          log.warn(`[ShortcutService] 注册快捷键失败: ${shortcuts.togglePause} (可能与其他应用冲突)`)
        }
      }

      // 立即休息
      if (shortcuts.takeBreak) {
        const success = globalShortcut.register(shortcuts.takeBreak, () => {
          log.info('[Shortcut] 立即休息')
          this.callbacks!.onTakeBreak()
        })
        if (!success) {
          log.warn(`[ShortcutService] 注册快捷键失败: ${shortcuts.takeBreak} (可能与其他应用冲突)`)
        }
      }

      // 跳过休息
      if (shortcuts.skipBreak) {
        const success = globalShortcut.register(shortcuts.skipBreak, () => {
          log.info('[Shortcut] 跳过休息')
          this.callbacks!.onSkipBreak()
        })
        if (!success) {
          log.warn(`[ShortcutService] 注册快捷键失败: ${shortcuts.skipBreak} (可能与其他应用冲突)`)
        }
      }

      this.registered = true
      log.info('[ShortcutService] 全局快捷键已注册:', shortcuts)
    } catch (error) {
      log.error('[ShortcutService] 注册快捷键失败:', error)
    }
  }

  /** 注销所有快捷键 */
  unregister(): void {
    globalShortcut.unregisterAll()
    this.registered = false
    log.info('[ShortcutService] 全局快捷键已注销')
  }

  /** 获取当前快捷键配置 */
  getShortcuts(): ShortcutSettings {
    const settings = settingsStore.getAll()
    return { ...settings.general.globalShortcuts }
  }

  /** 销毁 */
  destroy(): void {
    this.unregister()
  }
}

export const shortcutService = new ShortcutService()
