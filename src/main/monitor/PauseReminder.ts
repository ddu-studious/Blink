// ========================================
// 暂停护眼提醒模块
// 检测用户手动暂停护眼超过一定时间后，发送系统通知提醒开启
// ========================================

import { Notification } from 'electron'
import { EventEmitter } from 'events'
import log from 'electron-log'

const DEFAULT_REMIND_INTERVAL_MS = 30 * 60 * 1000 // 30 分钟
const CHECK_INTERVAL_MS = 60 * 1000 // 每分钟检查

export class PauseReminder extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private pausedSince: number = 0
  private lastReminderTime: number = 0
  private isActive = false

  /** 用户手动暂停护眼时调用 */
  onPaused(): void {
    if (this.isActive) return
    this.isActive = true
    this.pausedSince = Date.now()
    this.lastReminderTime = 0

    if (!this.checkInterval) {
      this.checkInterval = setInterval(() => this.check(), CHECK_INTERVAL_MS)
    }

    log.info('[PauseReminder] 开始监控暂停时长')
  }

  /** 用户恢复护眼时调用 */
  onResumed(): void {
    this.isActive = false
    this.pausedSince = 0
    this.lastReminderTime = 0

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    log.info('[PauseReminder] 护眼已恢复，停止监控')
  }

  private check(): void {
    if (!this.isActive || this.pausedSince === 0) return

    const now = Date.now()
    const pausedDuration = now - this.pausedSince
    const timeSinceLastReminder = now - this.lastReminderTime

    // 暂停超过 30 分钟且距上次提醒超过 30 分钟
    if (pausedDuration >= DEFAULT_REMIND_INTERVAL_MS &&
        (this.lastReminderTime === 0 || timeSinceLastReminder >= DEFAULT_REMIND_INTERVAL_MS)) {
      this.lastReminderTime = now
      this.showNotification(pausedDuration)
    }
  }

  private showNotification(pausedDuration: number): void {
    const minutes = Math.floor(pausedDuration / 60000)
    const isMac = process.platform === 'darwin'

    const notification = new Notification({
      title: '👁️ 护眼提醒',
      body: `您已暂停护眼 ${minutes} 分钟，长时间用眼请注意休息`,
      silent: false,
      ...(isMac
        ? {
            actions: [{ type: 'button' as const, text: '开启护眼' }],
            closeButtonText: '稍后'
          }
        : {})
    })

    notification.on('action', () => {
      this.emit('resume-requested')
    })

    notification.on('click', () => {
      this.emit('resume-requested')
    })

    notification.show()
    log.info(`[PauseReminder] 已发送暂停提醒 (已暂停 ${minutes} 分钟)`)
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.removeAllListeners()
  }
}
