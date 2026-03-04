// ========================================
// 计时器管理器 - 核心计时逻辑
// ========================================

import { EventEmitter } from 'events'
import { BreakType, RestScreenMode, TimerState, TimerStatus, AppSettings } from '../types'
import { settingsStore } from '../store/SettingsStore'
import { statsDatabase } from '../store/StatsDatabase'
import log from 'electron-log'
import dayjs from 'dayjs'

/** 暂停来源标识 */
type PauseSource = 'idle' | 'suspend' | 'lock-screen' | 'dnd' | 'fullscreen' | 'manual' | 'schedule'

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

  // 预告通知状态
  private miniBreakWarned = false
  private longBreakWarned = false

  // 多暂停源追踪：只有所有暂停源都解除时才恢复
  private activePauseSources = new Set<PauseSource>()

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

  /** 跨天时重新加载今日统计（公开方法，供日期变更检测调用） */
  reloadTodayStats(): void {
    this.loadTodayStats()
    this.emitState()
    log.info('[TimerManager] 已重新加载今日统计数据')
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
    this.miniBreakWarned = false
    this.longBreakWarned = false
  }

  /** 启动计时器 */
  start(): void {
    // 如果已经在运行，直接返回
    if (this.status === 'running') return

    // 如果处于暂停状态，走恢复路径
    if (this.status === 'paused') {
      this.resume()
      return
    }

    // 如果正在休息中，不允许启动
    if (this.status === 'break') {
      log.warn('[TimerManager] 休息中，无法启动计时器')
      return
    }

    // 从 idle 状态启动
    this.status = 'running'
    this.resetCountdowns()
    this.loadTodayStats()

    // 确保清除旧的定时器（防止重复）
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
    }

    // 每秒一次心跳
    this.tickInterval = setInterval(() => this.tick(), 1000)

    log.info('[TimerManager] 计时器已启动')
    this.emitState()
  }

  /** 确保计时器正在运行（保活方法） */
  ensureRunning(): void {
    // 如果状态是 idle，自动启动
    if (this.status === 'idle') {
      log.info('[TimerManager] 检测到 idle 状态，自动启动计时器')
      this.start()
      return
    }

    // 如果是用户手动暂停的，不自动恢复 — 尊重用户意愿
    if (this.isManuallyPaused()) {
      return
    }

    // 如果状态是 paused（非手动）且在工作时段内且无活跃暂停源，自动恢复
    if (this.status === 'paused' && this.isInWorkSchedule() && this.activePauseSources.size === 0) {
      log.info('[TimerManager] 检测到非手动 paused 状态且在工作时段，自动恢复')
      this.status = 'running'
      this.emitState()
      return
    }

    // 如果状态是 running 但定时器丢失，重新创建
    if (this.status === 'running' && !this.tickInterval) {
      log.warn('[TimerManager] 检测到定时器丢失，重新创建')
      this.tickInterval = setInterval(() => this.tick(), 1000)
      this.emitState()
    }
  }

  /** 暂停计时器（用户手动从托盘/快捷键触发） */
  pause(): void {
    if (this.status !== 'running') return
    this.activePauseSources.add('manual')
    this.status = 'paused'
    log.info('[TimerManager] 用户手动暂停')
    this.emitState()
  }

  /** 恢复计时器（用户手动从托盘/快捷键触发） — 清除所有暂停源 */
  resume(): void {
    if (this.status !== 'paused') return
    this.activePauseSources.clear()
    this.status = 'running'
    log.info('[TimerManager] 用户手动恢复')
    this.emitState()
  }

  /** 是否由用户手动暂停 */
  isManuallyPaused(): boolean {
    return this.status === 'paused' && this.activePauseSources.has('manual')
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
    this.activePauseSources.clear()
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

  /** 检查当前是否在工作时段内 */
  private isInWorkSchedule(): boolean {
    const settings = this.getSettings()
    const schedule = settings.smart.workSchedule
    if (!schedule || !schedule.enabled) return true // 未启用则始终工作

    const now = dayjs()
    const currentDay = now.day() // 0=周日, 1=周一...
    if (!schedule.daysOfWeek.includes(currentDay)) return false

    const [startH, startM] = schedule.startTime.split(':').map(Number)
    const [endH, endM] = schedule.endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const currentMinutes = now.hour() * 60 + now.minute()

    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  }

  /** 工作时间心跳 */
  private tickWork(): void {
    const settings = this.getSettings()

    // 检查工作时段
    if (!this.isInWorkSchedule()) {
      if (this.status === 'running') {
        this.addPauseSource('schedule')
      }
      return
    } else {
      // 回到工作时段后，移除工作时段暂停源
      if (this.activePauseSources.has('schedule')) {
        this.removePauseSource('schedule')
      }
    }

    // Mini Break 倒计时
    if (settings.reminder.miniBreak.enabled) {
      this.miniBreakCountdown--

      // 30 秒预告通知
      if (this.miniBreakCountdown === 30 && !this.miniBreakWarned) {
        this.miniBreakWarned = true
        this.emit('break-warning', { type: 'mini' })
      }

      if (this.miniBreakCountdown <= 0) {
        this.miniBreakWarned = false
        this.startBreak('mini')
        return
      }
    }

    // Long Break 倒计时
    if (settings.reminder.longBreak.enabled) {
      this.longBreakCountdown--

      // 30 秒预告通知
      if (this.longBreakCountdown === 30 && !this.longBreakWarned) {
        this.longBreakWarned = true
        this.emit('break-warning', { type: 'long' })
      }

      if (this.longBreakCountdown <= 0) {
        this.longBreakWarned = false
        this.startBreak('long')
        return
      }
    }

    // 每秒广播状态（确保前端倒计时流畅）
    this.emitState()
  }

  /** 休息时间心跳 */
  private tickBreak(): void {
    // 页面未就绪时不递减倒计时，只广播状态
    if (this.breakPendingReady) {
      this.emitState()
      return
    }

    this.breakCountdown--

    if (this.breakCountdown <= 0) {
      this.completeBreak()
      return
    }

    // 休息中每秒广播状态 (显示倒计时)
    this.emitState()
  }

  // 延迟倒计时：页面就绪前暂停 break 计时
  private breakPendingReady = false

  /** 开始休息 */
  startBreak(type: BreakType, forceMode?: RestScreenMode): void {
    const settings = this.getSettings()
    const duration =
      type === 'mini'
        ? settings.reminder.miniBreak.duration
        : settings.reminder.longBreak.duration

    this.status = 'break'
    this.currentBreakType = type
    this.breakCountdown = duration
    this.breakStartTime = dayjs().toISOString()
    this.breakPendingReady = true

    log.info(`[TimerManager] 开始 ${type} 休息，时长 ${duration} 秒${forceMode ? `，强制模式: ${forceMode}` : ''}，等待页面就绪`)

    this.emit('break-start', { type, duration, forceMode })
    this.emitState()
  }

  /** 页面就绪后真正开始休息倒计时 */
  onBreakPageReady(): void {
    if (this.breakPendingReady) {
      this.breakPendingReady = false
      log.info(`[TimerManager] 页面就绪，开始 ${this.currentBreakType} 休息倒计时`)
      this.emitState()
    }
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
  takeBreakNow(type: BreakType = 'mini', forceMode?: RestScreenMode): void {
    if (this.status === 'break') return
    this.startBreak(type, forceMode)
  }

  /** 防作弊: 检测到活动时重置休息倒计时 */
  resetBreakCountdown(): void {
    if (this.status !== 'break' || !this.currentBreakType) return

    const settings = this.getSettings()
    if (!settings.smart.strictMode) return

    const duration =
      this.currentBreakType === 'mini'
        ? settings.reminder.miniBreak.duration
        : settings.reminder.longBreak.duration

    this.breakCountdown = duration
    log.info(`[TimerManager] 严格模式: 检测到活动，重置休息倒计时至 ${duration} 秒`)
    this.emitState()
  }

  /** 添加自动暂停源并暂停（系统触发，非用户手动） */
  addPauseSource(source: PauseSource): void {
    if (this.status !== 'running' && this.status !== 'paused') return

    this.activePauseSources.add(source)
    if (this.status === 'running') {
      this.status = 'paused'
      log.info(`[TimerManager] 自动暂停 (来源: ${source}, 当前暂停源: ${[...this.activePauseSources].join(', ')})`)
      this.emitState()
    }
  }

  /** 移除自动暂停源，所有源都移除后才恢复 */
  removePauseSource(source: PauseSource): void {
    this.activePauseSources.delete(source)

    if (this.status === 'paused' && this.activePauseSources.size === 0) {
      this.status = 'running'
      log.info(`[TimerManager] 所有暂停源已移除，自动恢复 (移除: ${source})`)
      this.emitState()
    } else if (this.activePauseSources.size > 0) {
      log.info(`[TimerManager] 暂停源 ${source} 已移除，但仍有活跃暂停源: ${[...this.activePauseSources].join(', ')}`)
    }
  }

  /** 处理系统挂起 (休眠) */
  handleSuspend(): void {
    this.addPauseSource('suspend')
  }

  /** 处理系统恢复 */
  handleResume(): void {
    this.removePauseSource('suspend')
  }

  /** 处理锁屏 */
  handleLockScreen(): void {
    this.addPauseSource('lock-screen')
  }

  /** 处理解锁屏幕 */
  handleUnlockScreen(): void {
    this.removePauseSource('lock-screen')
  }

  /** 处理免打扰模式 */
  handleDnd(isDnd: boolean): void {
    if (isDnd) this.addPauseSource('dnd')
    else this.removePauseSource('dnd')
  }

  /** 处理全屏应用检测 */
  handleFullscreen(isFullscreen: boolean): void {
    if (isFullscreen) this.addPauseSource('fullscreen')
    else this.removePauseSource('fullscreen')
  }

  /** 处理空闲检测 */
  handleIdle(isIdle: boolean): void {
    const settings = this.getSettings()
    if (!settings.smart.idleDetectionEnabled) return

    if (isIdle) this.addPauseSource('idle')
    else this.removePauseSource('idle')
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
