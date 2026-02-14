// ========================================
// 青眸 (QingMou) - 共享类型定义
// ========================================

/** 休息类型 */
export type BreakType = 'mini' | 'long'

/** 计时器状态 */
export type TimerStatus = 'running' | 'paused' | 'break' | 'idle'

/** 休息记录状态 */
export type BreakRecordStatus = 'completed' | 'skipped' | 'interrupted'

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'system'

/** 通知方式 */
export type NotificationMode = 'overlay' | 'notification' | 'both'

/** 语言 */
export type Language = 'zh-CN' | 'en-US'

// ---- 设置数据结构 ----

export interface GeneralSettings {
  autoLaunch: boolean
  language: Language
  theme: ThemeMode
}

export interface MiniBreakSettings {
  enabled: boolean
  interval: number // 分钟 (10-60, 默认 20)
  duration: number // 秒 (10-60, 默认 20)
}

export interface LongBreakSettings {
  enabled: boolean
  interval: number // 分钟 (30-180, 默认 60)
  duration: number // 秒 (60-900, 默认 300)
}

export interface ReminderSettings {
  miniBreak: MiniBreakSettings
  longBreak: LongBreakSettings
  notificationMode: NotificationMode
  soundEnabled: boolean
  soundVolume: number // 0-100
  skipButtonDelay: number // 秒 (0-30, 默认 5)
}

export interface SmartSettings {
  idleDetectionEnabled: boolean
  idleThreshold: number // 分钟 (1-15, 默认 5)
  dndAware: boolean
  fullscreenDetection: boolean
  strictMode: boolean
}

export interface AppSettings {
  general: GeneralSettings
  reminder: ReminderSettings
  smart: SmartSettings
  firstRun: boolean
}

// ---- 计时器状态 ----

export interface TimerState {
  status: TimerStatus
  /** 距离下次 Mini Break 的剩余秒数 */
  miniBreakRemaining: number
  /** 距离下次 Long Break 的剩余秒数 */
  longBreakRemaining: number
  /** 当前休息类型 (如果正在休息) */
  currentBreakType: BreakType | null
  /** 当前休息剩余秒数 */
  breakRemaining: number
  /** 今日已完成的 Mini Break 次数 */
  todayMiniBreaks: number
  /** 今日已完成的 Long Break 次数 */
  todayLongBreaks: number
  /** 今日跳过次数 */
  todaySkipped: number
}

// ---- IPC 通道定义 ----

export const IPC_CHANNELS = {
  // 计时器
  TIMER_START: 'timer:start',
  TIMER_PAUSE: 'timer:pause',
  TIMER_RESUME: 'timer:resume',
  TIMER_RESET: 'timer:reset',
  TIMER_SKIP: 'timer:skip',
  TIMER_TAKE_BREAK: 'timer:take-break',
  TIMER_STATE: 'timer:state',
  TIMER_STATE_UPDATE: 'timer:state-update',

  // 休息
  BREAK_SKIP: 'break:skip',
  BREAK_COMPLETE: 'break:complete',

  // 设置
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',

  // 统计
  STATS_GET_TODAY: 'stats:get-today',
  STATS_GET_RANGE: 'stats:get-range',

  // 应用
  APP_QUIT: 'app:quit',
  APP_GET_VERSION: 'app:get-version'
} as const

// ---- 默认设置 ----

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    autoLaunch: false,
    language: 'zh-CN',
    theme: 'system'
  },
  reminder: {
    miniBreak: {
      enabled: true,
      interval: 20,
      duration: 20
    },
    longBreak: {
      enabled: true,
      interval: 60,
      duration: 300
    },
    notificationMode: 'overlay',
    soundEnabled: true,
    soundVolume: 50,
    skipButtonDelay: 5
  },
  smart: {
    idleDetectionEnabled: true,
    idleThreshold: 5,
    dndAware: true,
    fullscreenDetection: true,
    strictMode: false
  },
  firstRun: true
}
