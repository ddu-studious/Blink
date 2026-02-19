// ========================================
// 空闲检测模块
// ========================================
//
// 结合 powerMonitor.getSystemIdleTime() 和 MediaActivityDetector
// 避免在用户被动消费内容（看视频、开会）时误判为空闲

import { powerMonitor } from 'electron'
import { EventEmitter } from 'events'
import { settingsStore } from '../store/SettingsStore'
import { MediaActivityDetector } from './MediaActivityDetector'
import log from 'electron-log'

export class IdleDetector extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private wasIdle = false
  private mediaDetector: MediaActivityDetector

  constructor() {
    super()
    this.mediaDetector = new MediaActivityDetector()
  }

  /** 启动空闲检测 */
  start(): void {
    if (this.checkInterval) return

    this.mediaDetector.start()

    // 每 30 秒检查一次空闲状态
    this.checkInterval = setInterval(() => this.check(), 30 * 1000)

    log.info('[IdleDetector] 空闲检测已启动（含媒体活动检测）')
  }

  /** 停止空闲检测 */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.mediaDetector.stop()
  }

  /** 检查空闲状态 */
  private check(): void {
    const settings = settingsStore.getAll()
    if (!settings.smart.idleDetectionEnabled) return

    const thresholdSeconds = settings.smart.idleThreshold * 60
    const idleTime = powerMonitor.getSystemIdleTime()
    const inputIdle = idleTime >= thresholdSeconds

    // 如果有媒体活动（视频/会议等），即使没有键鼠输入也不算空闲
    const mediaActive = this.mediaDetector.isMediaActive
    const isIdle = inputIdle && !mediaActive

    if (isIdle && !this.wasIdle) {
      this.wasIdle = true
      log.info(`[IdleDetector] 用户空闲 (${idleTime}秒 >= ${thresholdSeconds}秒阈值, 媒体活动: ${mediaActive})`)
      this.emit('idle', true)
    } else if (!isIdle && this.wasIdle) {
      this.wasIdle = false
      if (mediaActive && inputIdle) {
        log.info(`[IdleDetector] 检测到媒体活动，取消空闲判定 (用户可能在看视频/开会)`)
      } else {
        log.info(`[IdleDetector] 用户活动恢复 (空闲时间 ${idleTime}秒)`)
      }
      this.emit('idle', false)
    }
  }

  /** 获取当前空闲时间 (秒) */
  getIdleTime(): number {
    return powerMonitor.getSystemIdleTime()
  }

  /** 获取媒体活动状态 */
  getMediaActive(): boolean {
    return this.mediaDetector.isMediaActive
  }

  /** 销毁 */
  destroy(): void {
    this.stop()
    this.mediaDetector.destroy()
    this.removeAllListeners()
  }
}
