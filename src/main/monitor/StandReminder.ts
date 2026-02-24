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

const SNOOZE_DELAY_MS = 5 * 60 * 1000

export class StandReminder extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private lastReminderTime: number = 0
  private snoozeTimer: NodeJS.Timeout | null = null

  start(): void {
    if (this.checkInterval) return

    this.lastReminderTime = Date.now()

    this.checkInterval = setInterval(() => this.check(), 60 * 1000)

    log.info('[StandReminder] 站立提醒已启动')
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.clearSnooze()
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
    const isMac = process.platform === 'darwin'

    const notification = new Notification({
      title: msg.title,
      body: msg.body,
      silent: false,
      ...(isMac
        ? {
            actions: [
              { type: 'button', text: '已站立' },
              { type: 'button', text: '稍后提醒' }
            ],
            closeButtonText: '忽略'
          }
        : {})
    })

    notification.on('action', (event) => {
      const actionIndex = (event as unknown as { actionIndex: number }).actionIndex
      if (actionIndex === 0) {
        this.handleStandConfirmed()
      } else if (actionIndex === 1) {
        this.handleSnooze()
      }
    })

    notification.on('click', () => {
      this.emit('stand-reminder-clicked')
    })

    notification.show()
    log.info('[StandReminder] 站立提醒已发送')
  }

  /** 用户确认已站立 */
  private handleStandConfirmed(): void {
    this.clearSnooze()
    this.reset()
    this.emit('stand-confirmed')

    new Notification({
      title: '💪 很棒！',
      body: '已记录站立活动，身体会感谢你的',
      silent: true
    }).show()

    log.info('[StandReminder] 用户确认已站立（通知按钮）')
  }

  /** 稍后提醒 */
  private handleSnooze(): void {
    this.clearSnooze()
    this.snoozeTimer = setTimeout(() => {
      this.snoozeTimer = null
      this.showNotification()
    }, SNOOZE_DELAY_MS)

    log.info('[StandReminder] 用户选择稍后提醒，5 分钟后再次提醒')
  }

  private clearSnooze(): void {
    if (this.snoozeTimer) {
      clearTimeout(this.snoozeTimer)
      this.snoozeTimer = null
    }
  }

  /** 手动标记已站立，重置计时 */
  reset(): void {
    this.lastReminderTime = Date.now()
    this.clearSnooze()
    log.info('[StandReminder] 手动重置站立提醒计时')
  }

  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}
