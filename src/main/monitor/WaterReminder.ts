// ========================================
// 独立喝水提醒模块
// ========================================

import { Notification } from 'electron'
import { EventEmitter } from 'events'
import { settingsStore } from '../store/SettingsStore'
import { statsDatabase } from '../store/StatsDatabase'
import log from 'electron-log'

export class WaterReminder extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private lastReminderTime: number = 0

  start(): void {
    if (this.checkInterval) return

    this.lastReminderTime = Date.now()

    // 每 60 秒检查一次是否需要提醒
    this.checkInterval = setInterval(() => this.check(), 60 * 1000)

    log.info('[WaterReminder] 独立喝水提醒已启动')
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private check(): void {
    const settings = settingsStore.getAll()
    if (!settings.water?.enabled || !settings.water?.independentReminder) return

    const intervalMs = settings.water.reminderInterval * 60 * 1000
    const now = Date.now()

    if (now - this.lastReminderTime >= intervalMs) {
      this.lastReminderTime = now

      const todayWater = statsDatabase.getWaterToday()
      const dailyGoal = settings.water.dailyGoal
      const remaining = dailyGoal - todayWater.totalMl

      if (remaining > 0) {
        this.showNotification(todayWater.totalMl, dailyGoal)
        this.emit('water-reminder', { totalMl: todayWater.totalMl, dailyGoal })
      }
    }
  }

  private showNotification(currentMl: number, dailyGoal: number): void {
    const cups = Math.round(currentMl / 250)
    const goalCups = Math.round(dailyGoal / 250)
    const percent = Math.round((currentMl / dailyGoal) * 100)

    const notification = new Notification({
      title: '💧 该喝水了',
      body: `今日已喝 ${cups}/${goalCups} 杯 (${percent}%)，记得补充水分哦`,
      silent: false
    })

    notification.on('click', () => {
      this.emit('water-reminder-clicked')
    })

    notification.show()
    log.info(`[WaterReminder] 喝水提醒已发送 (${currentMl}/${dailyGoal}ml)`)
  }

  /** 记录喝水后重置计时 */
  resetTimer(): void {
    this.lastReminderTime = Date.now()
    log.info('[WaterReminder] 喝水后重置提醒计时')
  }

  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}
