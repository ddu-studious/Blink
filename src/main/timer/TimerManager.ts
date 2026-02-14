// ========================================
// 计时器管理器 - 核心计时逻辑
// ========================================

import { EventEmitter } from 'events'
import { BreakType, TimerState, TimerStatus, AppSettings } from '../types'
import { settingsStore } from '../store/SettingsStore'
import { statsDatabase } from '../store/StatsDatabase'
import log from 'electron-log'
import dayjs from 'dayjs'

export class TimerManager extends EventEmitter {
  private tickInterval: NodeJS.Timeout | null = null
  private status: TimerStatus = 'idle'

  // 倒计时秒数
  private miniBreakCountdown = 0
  private longBreakCountdown = 0

  // 休息中的状态
  private currentBreakType: BreakType | null = null
  private breakCountdown = 0
  private breakStartTime: string | null = null

  // 今日统计 (从数据库加载)
  private todayMiniBreaks = 0
  private todayLongBreaks = 0
  private todaySkipped = 0

  constructor() {
    super()
    this.loadTodayStats()
  }

  /** 从数据库加载今日统计 */
  private loadTodayStats(): void {
    try {
      const stats = statsDatabase.getTodayStats()
      this.todayMiniBreaks = stats.miniBreaksCompleted
      this.todayLongBreaks = stats.longBreaksCompleted
      this.todaySkipped = stats.miniBreaksSkipped + stats.longBreaksSkipped
    } catch {
      // 数据库可能尚未初始化
    }
  }

  /** 获取当前设置 */
  private getSettings(): AppSettings {
    return settingsStore.getAll()
  }

  /** 初始化倒计时 */
  private resetCountdowns(): void {
    const settings = this.getSettings()
    this.miniBreakCountdown = settings.reminder.miniBreak.interval * 60
    this.longBreakCountdown = settings.reminder.longBreak.interval * 60
  }

  /** 启动计时器 */
  start(): void {
    if (this.status === 'running') return

    this.status = 'running'
    this.resetCountdowns()
    this.loadTodayStats()

    // 每秒一次心跳
    this.tickInterval = setInterval(() => this.tick(), 1000)

    log.info('[TimerManager] 计时器已启动')
    this.emitState()
  }

  /** 暂停计时器 */
  pause(): void {
    if (this.status !== 'running') return
    this.status = 'paused'
    log.info('[TimerManager] 计时器已暂停')
    this.emitState()
  }

  /** 恢复计时器 */
  resume(): void {
    if (this.status !== 'paused') return
    this.status = 'running'
    log.info('[TimerManager] 计时器已恢复')
    this.emitState()
  }

  /** 停止计时器 */
  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
    this.status = 'idle'
    this.currentBreakType = null
    this.breakCountdown = 0
    log.info('[TimerManager] 计时器已停止')
    this.emitState()
  }

  /** 每秒心跳 */
  private tick(): void {
    if (this.status === 'running') {
      this.tickWork()
    } else if (this.status === 'break') {
      this.tickBreak()
    }
  }

  /** 工作时间心跳 */
  private tickWork(): void {
    const settings = this.getSettings()

    // Mini Break 倒计时
    if (settings.reminder.miniBreak.enabled) {
      this.miniBreakCountdown--
      if (this.miniBreakCountdown <= 0) {
        this.startBreak('mini')
        return
      }
    }

    // Long Break 倒计时
    if (settings.reminder.longBreak.enabled) {
      this.longBreakCountdown--
      if (this.longBreakCountdown <= 0) {
        this.startBreak('long')
        return
      }
    }

    // 每 5 秒广播一次状态 (减少开销)
    if (this.miniBreakCountdown % 5 === 0) {
      this.emitState()
    }
  }

  /** 休息时间心跳 */
  private tickBreak(): void {
    this.breakCountdown--

    if (this.breakCountdown <= 0) {
      this.completeBreak()
      return
    }

    // 休息中每秒广播状态 (显示倒计时)
    this.emitState()
  }

  /** 开始休息 */
  startBreak(type: BreakType): void {
    const settings = this.getSettings()
    const duration =
      type === 'mini'
        ? settings.reminder.miniBreak.duration
        : settings.reminder.longBreak.duration

    this.status = 'break'
    this.currentBreakType = type
    this.breakCountdown = duration
    this.breakStartTime = dayjs().toISOString()

    log.info(`[TimerManager] 开始 ${type} 休息，时长 ${duration} 秒`)

    // 通知主进程显示休息窗口
    this.emit('break-start', { type, duration })
    this.emitState()
  }

  /** 完成休息 */
  private completeBreak(): void {
    const type = this.currentBreakType!
    const settings = this.getSettings()
    const plannedDuration =
      type === 'mini'
        ? settings.reminder.miniBreak.duration
        : settings.reminder.longBreak.duration

    // 记录到数据库
    statsDatabase.addBreakRecord({
      breakType: type,
      startedAt: this.breakStartTime!,
      endedAt: dayjs().toISOString(),
      plannedDuration,
      actualDuration: plannedDuration,
      status: 'completed',
      createdDate: dayjs().format('YYYY-MM-DD')
    })

    // 更新本地统计
    if (type === 'mini') this.todayMiniBreaks++
    else this.todayLongBreaks++

    log.info(`[TimerManager] ${type} 休息完成`)

    // 重置计时并恢复工作
    this.currentBreakType = null
    this.breakCountdown = 0
    this.breakStartTime = null
    this.status = 'running'

    // 重置对应的倒计时
    if (type === 'mini') {
      this.miniBreakCountdown = settings.reminder.miniBreak.interval * 60
    }
    // Long break 同时重置 mini break 计时
    if (type === 'long') {
      this.longBreakCountdown = settings.reminder.longBreak.interval * 60
      this.miniBreakCountdown = settings.reminder.miniBreak.interval * 60
    }

    this.emit('break-end', { type })
    this.emitState()
  }

  /** 跳过当前休息 */
  skipBreak(): void {
    if (this.status !== 'break' || !this.currentBreakType) return

    const type = this.currentBreakType
    const settings = this.getSettings()
    const plannedDuration =
      type === 'mini'
        ? settings.reminder.miniBreak.duration
        : settings.reminder.longBreak.duration

    // 记录跳过
    statsDatabase.addBreakRecord({
      breakType: type,
      startedAt: this.breakStartTime!,
      endedAt: dayjs().toISOString(),
      plannedDuration,
      actualDuration: plannedDuration - this.breakCountdown,
      status: 'skipped',
      createdDate: dayjs().format('YYYY-MM-DD')
    })

    this.todaySkipped++
    log.info(`[TimerManager] 用户跳过 ${type} 休息`)

    // 恢复工作
    this.currentBreakType = null
    this.breakCountdown = 0
    this.breakStartTime = null
    this.status = 'running'

    // 重置倒计时
    if (type === 'mini') {
      this.miniBreakCountdown = settings.reminder.miniBreak.interval * 60
    } else {
      this.longBreakCountdown = settings.reminder.longBreak.interval * 60
      this.miniBreakCountdown = settings.reminder.miniBreak.interval * 60
    }

    this.emit('break-end', { type, skipped: true })
    this.emitState()
  }

  /** 手动触发休息 */
  takeBreakNow(type: BreakType = 'mini'): void {
    if (this.status === 'break') return
    this.startBreak(type)
  }

  /** 处理系统挂起 (休眠/锁屏) */
  handleSuspend(): void {
    if (this.status === 'running') {
      this.pause()
      log.info('[TimerManager] 系统挂起，自动暂停')
    }
  }

  /** 处理系统恢复 */
  handleResume(): void {
    if (this.status === 'paused') {
      this.resume()
      log.info('[TimerManager] 系统恢复，自动继续')
    }
  }

  /** 处理空闲检测 */
  handleIdle(isIdle: boolean): void {
    const settings = this.getSettings()
    if (!settings.smart.idleDetectionEnabled) return

    if (isIdle && this.status === 'running') {
      this.pause()
      log.info('[TimerManager] 用户空闲，自动暂停')
    } else if (!isIdle && this.status === 'paused') {
      this.resume()
      log.info('[TimerManager] 用户活动，自动恢复')
    }
  }

  /** 获取当前状态 */
  getState(): TimerState {
    return {
      status: this.status,
      miniBreakRemaining: this.miniBreakCountdown,
      longBreakRemaining: this.longBreakCountdown,
      currentBreakType: this.currentBreakType,
      breakRemaining: this.breakCountdown,
      todayMiniBreaks: this.todayMiniBreaks,
      todayLongBreaks: this.todayLongBreaks,
      todaySkipped: this.todaySkipped
    }
  }

  /** 广播状态 */
  private emitState(): void {
    this.emit('state-update', this.getState())
  }

  /** 销毁 */
  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}
