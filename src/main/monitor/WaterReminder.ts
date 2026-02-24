// ========================================
// 独立喝水提醒模块
// ========================================

import { Notification } from 'electron'
import { EventEmitter } from 'events'
import { settingsStore } from '../store/SettingsStore'
import { statsDatabase } from '../store/StatsDatabase'
import log from 'electron-log'

const SNOOZE_DELAY_MS = 5 * 60 * 1000

export class WaterReminder extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private lastReminderTime: number = 0
  private snoozeTimer: NodeJS.Timeout | null = null

  start(): void {
    if (this.checkInterval) return

    this.lastReminderTime = Date.now()

    this.checkInterval = setInterval(() => this.check(), 60 * 1000)

    log.info('[WaterReminder] 独立喝水提醒已启动')
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

    const isMac = process.platform === 'darwin'

    const notification = new Notification({
      title: '💧 该喝水了',
      body: `今日已喝 ${cups}/${goalCups} 杯 (${percent}%)，记得补充水分哦`,
      silent: false,
      ...(isMac
        ? {
            actions: [
              { type: 'button', text: '已喝水' },
              { type: 'button', text: '稍后提醒' }
            ],
            closeButtonText: '忽略'
          }
        : {})
    })

    notification.on('action', (event) => {
      const actionIndex = (event as unknown as { actionIndex: number }).actionIndex
      if (actionIndex === 0) {
        this.handleDrinkConfirmed()
      } else if (actionIndex === 1) {
        this.handleSnooze()
      }
    })

    notification.on('click', () => {
      this.handleDrinkConfirmed()
    })

    notification.show()
    log.info(`[WaterReminder] 喝水提醒已发送 (${currentMl}/${dailyGoal}ml)`)
  }

  /** 用户确认已喝水 */
  private handleDrinkConfirmed(): void {
    this.clearSnooze()
    this.emit('water-drink-confirmed')

    new Notification({
      title: '👍 做得好！',
      body: '已记录喝水，继续保持哦',
      silent: true
    }).show()

    log.info('[WaterReminder] 用户确认已喝水（通知按钮）')
  }

  /** 稍后提醒 */
  private handleSnooze(): void {
    this.clearSnooze()
    this.snoozeTimer = setTimeout(() => {
      this.snoozeTimer = null
      const todayWater = statsDatabase.getWaterToday()
      const dailyGoal = settingsStore.get('water').dailyGoal
      if (dailyGoal - todayWater.totalMl > 0) {
        this.showNotification(todayWater.totalMl, dailyGoal)
      }
    }, SNOOZE_DELAY_MS)

    log.info('[WaterReminder] 用户选择稍后提醒，5 分钟后再次提醒')
  }

  private clearSnooze(): void {
    if (this.snoozeTimer) {
      clearTimeout(this.snoozeTimer)
      this.snoozeTimer = null
    }
  }

  /** 记录喝水后重置计时 */
  resetTimer(): void {
    this.lastReminderTime = Date.now()
    this.clearSnooze()
    log.info('[WaterReminder] 喝水后重置提醒计时')
  }

  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}
