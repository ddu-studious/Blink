// ========================================
// 设置存储模块 - 基于 electron-store
// ========================================

import Store from 'electron-store'
import { AppSettings, DEFAULT_SETTINGS } from '../types'
import log from 'electron-log'

class SettingsStore {
  private store: Store<AppSettings>

  constructor() {
    this.store = new Store<AppSettings>({
      name: 'settings',
      defaults: DEFAULT_SETTINGS
    })

    log.info('[SettingsStore] 初始化完成，配置文件路径:', this.store.path)
  }

  /** 获取全部设置 */
  getAll(): AppSettings {
    return {
      general: this.store.get('general', DEFAULT_SETTINGS.general),
      reminder: this.store.get('reminder', DEFAULT_SETTINGS.reminder),
      smart: this.store.get('smart', DEFAULT_SETTINGS.smart),
      firstRun: this.store.get('firstRun', true)
    }
  }

  /** 获取指定路径的设置值 */
  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.store.get(key, DEFAULT_SETTINGS[key])
  }

  /** 更新设置 (深度合并) */
  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.store.set(key, value)
    log.info(`[SettingsStore] 更新设置: ${key}`)
  }

  /** 更新部分设置 */
  update(partial: Partial<AppSettings>): void {
    for (const [key, value] of Object.entries(partial)) {
      if (value !== undefined) {
        this.store.set(key, value)
      }
    }
    log.info('[SettingsStore] 批量更新设置')
  }

  /** 重置为默认设置 */
  reset(): void {
    this.store.clear()
    this.store.set(DEFAULT_SETTINGS)
    log.info('[SettingsStore] 已重置为默认设置')
  }

  /** 标记首次运行已完成 */
  markFirstRunDone(): void {
    this.store.set('firstRun', false)
  }

  /** 是否首次运行 */
  isFirstRun(): boolean {
    return this.store.get('firstRun', true)
  }
}

// 单例导出
export const settingsStore = new SettingsStore()
