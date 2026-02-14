// ========================================
// 空闲检测模块
// ========================================

import { powerMonitor } from 'electron'
import { EventEmitter } from 'events'
import { settingsStore } from '../store/SettingsStore'
import log from 'electron-log'

export class IdleDetector extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private wasIdle = false

  /** 启动空闲检测 */
  start(): void {
    if (this.checkInterval) return

    // 每 30 秒检查一次空闲状态
    this.checkInterval = setInterval(() => this.check(), 30 * 1000)

    log.info('[IdleDetector] 空闲检测已启动')
  }

  /** 停止空闲检测 */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /** 检查空闲状态 */
  private check(): void {
    const settings = settingsStore.getAll()
    if (!settings.smart.idleDetectionEnabled) return

    const thresholdSeconds = settings.smart.idleThreshold * 60
    const idleTime = powerMonitor.getSystemIdleTime()
    const isIdle = idleTime >= thresholdSeconds

    // 状态变化时才触发事件
    if (isIdle && !this.wasIdle) {
      this.wasIdle = true
      log.info(`[IdleDetector] 用户空闲 (${idleTime}秒 >= ${thresholdSeconds}秒阈值)`)
      this.emit('idle', true)
    } else if (!isIdle && this.wasIdle) {
      this.wasIdle = false
      log.info(`[IdleDetector] 用户活动恢复 (空闲时间 ${idleTime}秒)`)
      this.emit('idle', false)
    }
  }

  /** 获取当前空闲时间 (秒) */
  getIdleTime(): number {
    return powerMonitor.getSystemIdleTime()
  }

  /** 销毁 */
  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}
