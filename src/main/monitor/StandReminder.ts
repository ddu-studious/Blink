// ========================================
// 站立提醒模块 - 定时提醒用户站立活动
// ========================================

import { Notification } from 'electron'
import { EventEmitter } from 'events'
import { settingsStore } from '../store/SettingsStore'
import log from 'electron-log'

const STAND_MESSAGES = [
  { title: '🧍 该站起来了', body: '站立 1-2 分钟，活动一下腿部' },
  { title: '🚶 走动一下', body: '去倒杯水、走走廊，让身体动起来' },
  { title: '🧍 站立时间到', body: '短暂站立有助于改善血液循环' },
  { title: '🏃 活动时间', body: '原地踏步或做几个深蹲都很有帮助' }
]

export class StandReminder extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private lastReminderTime: number = 0

  start(): void {
    if (this.checkInterval) return

    this.lastReminderTime = Date.now()

    // 每 60 秒检查一次
    this.checkInterval = setInterval(() => this.check(), 60 * 1000)

    log.info('[StandReminder] 站立提醒已启动')
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private check(): void {
    const settings = settingsStore.getAll()
    if (!settings.exercise?.standReminder?.enabled) return

    const intervalMs = settings.exercise.standReminder.interval * 60 * 1000
    const now = Date.now()

    if (now - this.lastReminderTime >= intervalMs) {
      this.lastReminderTime = now
      this.showNotification()
      this.emit('stand-reminder')
    }
  }

  private showNotification(): void {
    const msg = STAND_MESSAGES[Math.floor(Math.random() * STAND_MESSAGES.length)]

    const notification = new Notification({
      title: msg.title,
      body: msg.body,
      silent: false
    })

    notification.on('click', () => {
      this.emit('stand-reminder-clicked')
    })

    notification.show()
    log.info('[StandReminder] 站立提醒已发送')
  }

  /** 手动标记已站立，重置计时 */
  reset(): void {
    this.lastReminderTime = Date.now()
    log.info('[StandReminder] 手动重置站立提醒计时')
  }

  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}
