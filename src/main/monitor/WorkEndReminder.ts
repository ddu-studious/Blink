// ========================================
// 下班提醒模块 - 到达设定时间后友好提醒
// ========================================

import { Notification } from 'electron'
import { EventEmitter } from 'events'
import { settingsStore } from '../store/SettingsStore'
import log from 'electron-log'
import dayjs from 'dayjs'

export class WorkEndReminder extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private todayNotified = false
  private todayDate: string = ''
  private postponedUntil: string | null = null

  start(): void {
    if (this.checkInterval) return

    this.todayDate = dayjs().format('YYYY-MM-DD')

    // 每 60 秒检查一次
    this.checkInterval = setInterval(() => this.check(), 60 * 1000)

    log.info('[WorkEndReminder] 下班提醒已启动')
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private check(): void {
    const settings = settingsStore.getAll()
    if (!settings.mindfulness?.workEndReminder?.enabled) return

    const now = dayjs()
    const todayStr = now.format('YYYY-MM-DD')

    // 跨天重置
    if (todayStr !== this.todayDate) {
      this.todayDate = todayStr
      this.todayNotified = false
      this.postponedUntil = null
    }

    if (this.todayNotified) return

    // 如果有延后，检查延后时间
    if (this.postponedUntil) {
      const postponeTime = dayjs(`${todayStr} ${this.postponedUntil}`)
      if (now.isBefore(postponeTime)) return
    }

    const endTime = settings.mindfulness.workEndReminder.time
    const [endH, endM] = endTime.split(':').map(Number)
    const endMinutes = endH * 60 + endM
    const currentMinutes = now.hour() * 60 + now.minute()

    if (currentMinutes >= endMinutes) {
      this.todayNotified = true
      this.showNotification(endTime)
      this.emit('work-end', { time: endTime })
      log.info(`[WorkEndReminder] 下班提醒已触发 (${endTime})`)
    }
  }

  private showNotification(time: string): void {
    const isMac = process.platform === 'darwin'

    const notification = new Notification({
      title: '🌙 下班时间到了',
      body: `现在是 ${time}，给今天画个句号，放松一下吧`,
      silent: false,
      ...(isMac
        ? {
            actions: [
              { type: 'button', text: '放松一下' },
              { type: 'button', text: '延后 30 分' }
            ],
            closeButtonText: '今日不再提醒'
          }
        : {})
    })

    notification.on('action', (event) => {
      const actionIndex = (event as unknown as { actionIndex: number }).actionIndex
      if (actionIndex === 0) {
        this.emit('work-end-action-requested')
      } else if (actionIndex === 1) {
        this.postpone()
      }
    })

    notification.on('click', () => {
      this.emit('work-end-action-requested')
    })

    notification.on('close', () => {
      if (isMac) {
        this.dismiss()
      }
    })

    notification.show()
  }

  postpone(): void {
    const settings = settingsStore.getAll()
    const minutes = settings.mindfulness?.workEndReminder?.postponeMinutes || 30
    const newTime = dayjs().add(minutes, 'minute')
    this.postponedUntil = newTime.format('HH:mm')
    this.todayNotified = false

    log.info(`[WorkEndReminder] 下班提醒延后至 ${this.postponedUntil}`)

    new Notification({
      title: '⏰ 已延后提醒',
      body: `将在 ${this.postponedUntil} 再次提醒你`,
      silent: true
    }).show()
  }

  dismiss(): void {
    this.todayNotified = true
    log.info('[WorkEndReminder] 今日下班提醒已关闭')
  }

  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}
