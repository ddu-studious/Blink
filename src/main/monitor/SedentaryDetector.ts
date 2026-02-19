// ========================================
// 久坐检测模块 - 检测连续使用时间
// ========================================

import { powerMonitor, Notification } from 'electron'
import { EventEmitter } from 'events'
import { settingsStore } from '../store/SettingsStore'
import log from 'electron-log'

export class SedentaryDetector extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private lastIdleTime: number = 0 // 最后一次空闲时间（Unix 时间戳，秒）
  private lastNotificationTime: number = 0 // 最后一次通知时间（Unix 时间戳，秒）
  private wasSedentary = false

  /** 启动久坐检测 */
  start(): void {
    if (this.checkInterval) return

    // 初始化：记录当前时间
    this.lastIdleTime = Math.floor(Date.now() / 1000)

    // 每 30 秒检查一次
    this.checkInterval = setInterval(() => this.check(), 30 * 1000)

    log.info('[SedentaryDetector] 久坐检测已启动')
  }

  /** 停止久坐检测 */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /** 检查久坐状态 */
  private check(): void {
    const settings = settingsStore.getAll()
    if (!settings.exercise?.sedentaryReminder?.enabled) return

    const thresholdMinutes = settings.exercise.sedentaryReminder.threshold
    const thresholdSeconds = thresholdMinutes * 60

    // 获取当前空闲时间（秒）
    const idleTime = powerMonitor.getSystemIdleTime()
    const now = Math.floor(Date.now() / 1000)

    // 如果空闲时间小于阈值，说明用户在使用电脑
    // 连续使用时间 = 当前时间 - 最后一次空闲时间
    if (idleTime < 5) {
      // 用户在使用（空闲时间 < 5 秒）
      const continuousUseTime = now - this.lastIdleTime

      if (continuousUseTime >= thresholdSeconds && !this.wasSedentary) {
        this.wasSedentary = true
        log.info(
          `[SedentaryDetector] 检测到久坐 (连续使用 ${Math.floor(continuousUseTime / 60)} 分钟 >= ${thresholdMinutes} 分钟阈值)`
        )
        this.emit('sedentary', { duration: continuousUseTime })
        this.showNotification(thresholdMinutes)
      }
    } else {
      // 用户空闲了，重置状态
      if (this.wasSedentary) {
        this.wasSedentary = false
        log.info('[SedentaryDetector] 用户已活动，重置久坐状态')
        this.emit('sedentary', { duration: 0 })
      }
      // 更新最后一次空闲时间
      this.lastIdleTime = now - idleTime
    }
  }

  /** 显示久坐提醒通知（点击可触发拉伸引导） */
  private showNotification(thresholdMinutes: number): void {
    const now = Math.floor(Date.now() / 1000)
    if (now - this.lastNotificationTime < 300) {
      return
    }
    this.lastNotificationTime = now

    const notification = new Notification({
      title: '🪑 久坐提醒',
      body: `您已连续使用 ${thresholdMinutes} 分钟，点击开始拉伸活动`,
      silent: false
    })

    notification.on('click', () => {
      this.emit('sedentary-action-requested')
    })

    notification.show()
  }

  /** 获取当前连续使用时间（秒） */
  getContinuousUseTime(): number {
    const idleTime = powerMonitor.getSystemIdleTime()
    const now = Math.floor(Date.now() / 1000)

    if (idleTime < 5) {
      return now - this.lastIdleTime
    }
    return 0
  }

  /** 重置久坐状态（用户手动标记已站立） */
  reset(): void {
    this.lastIdleTime = Math.floor(Date.now() / 1000)
    this.wasSedentary = false
    log.info('[SedentaryDetector] 手动重置久坐状态')
  }

  /** 销毁 */
  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}
