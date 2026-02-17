// ========================================
// 开机自启动服务
// ========================================

import AutoLaunch from 'auto-launch'
import { app } from 'electron'
import log from 'electron-log'

class AutoLaunchService {
  private autoLauncher: AutoLaunch

  constructor() {
    this.autoLauncher = new AutoLaunch({
      name: '青眸',
      path: app.getPath('exe'),
      isHidden: true // macOS: 隐藏 Dock 图标启动
    })
  }

  /** 设置开机自启动 */
  async setEnabled(enabled: boolean): Promise<void> {
    try {
      const isCurrentlyEnabled = await this.autoLauncher.isEnabled()

      if (enabled && !isCurrentlyEnabled) {
        await this.autoLauncher.enable()
        log.info('[AutoLaunch] 已启用开机自启动')
      } else if (!enabled && isCurrentlyEnabled) {
        await this.autoLauncher.disable()
        log.info('[AutoLaunch] 已禁用开机自启动')
      }
    } catch (error) {
      log.error('[AutoLaunch] 设置自启动失败:', error)
    }
  }

  /** 获取当前状态 */
  async isEnabled(): Promise<boolean> {
    try {
      return await this.autoLauncher.isEnabled()
    } catch {
      return false
    }
  }
}

export const autoLaunchService = new AutoLaunchService()
