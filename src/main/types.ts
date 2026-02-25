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

/** 休息屏幕模式 */
export type RestScreenMode = 'classic' | 'nature' | 'breathing' | 'eyeTraining' | 'darkScreen' | 'stretch' | 'mindful'

/** 环境音效类型 */
export type AmbientSoundType = 'birds' | 'stream' | 'waves' | 'wind' | 'rain'

// ---- 设置数据结构 ----

export interface ShortcutSettings {
  togglePause: string // 暂停/恢复快捷键
  takeBreak: string // 立即休息快捷键
  skipBreak: string // 跳过休息快捷键
}

export interface GeneralSettings {
  autoLaunch: boolean
  language: Language
  theme: ThemeMode
  shortcutsEnabled: boolean
  globalShortcuts: ShortcutSettings
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

/** 休息屏幕设置 */
export interface RestScreenSettings {
  miniBreakMode: RestScreenMode // 短休息使用的模式 (默认 classic)
  longBreakMode: RestScreenMode // 长休息使用的模式 (默认 nature)
  ambientSoundEnabled: boolean // 环境音效开关
  ambientSoundType: AmbientSoundType // 音效类型
}

export interface ReminderSettings {
  miniBreak: MiniBreakSettings
  longBreak: LongBreakSettings
  notificationMode: NotificationMode
  soundEnabled: boolean
  soundVolume: number // 0-100
  skipButtonDelay: number // 秒 (0-30, 默认 5)
  restScreen: RestScreenSettings // 休息屏幕设置
}

export interface WorkSchedule {
  enabled: boolean
  startTime: string // "09:00"
  endTime: string // "18:00"
  daysOfWeek: number[] // [1,2,3,4,5] = 周一到周五
}

export interface SmartSettings {
  idleDetectionEnabled: boolean
  idleThreshold: number // 分钟 (1-15, 默认 5)
  mediaActivityDetection: boolean // 检测媒体活动（视频/会议），防止误判空闲
  dndAware: boolean
  fullscreenDetection: boolean
  strictMode: boolean
  workSchedule: WorkSchedule
}

/** 喝水提醒设置 */
export interface WaterReminderSettings {
  enabled: boolean // 默认 true
  dailyGoal: number // ml, 默认 2000
  quickAmounts: number[] // 默认 [250, 500, 750]
  showInBreak: boolean // 休息时显示, 默认 true
  independentReminder: boolean // 独立提醒, 默认 false
  reminderInterval: number // 独立提醒间隔分钟, 默认 90
}

/** 运动健康设置 */
export interface ExerciseSettings {
  sedentaryReminder: {
    enabled: boolean // 默认 true
    threshold: number // 分钟，默认 30
  }
  standReminder: {
    enabled: boolean // 默认 true
    interval: number // 分钟，默认 60
  }
  stretchGuide: {
    enabled: boolean // 默认 true
    showInLongBreak: boolean // 默认 true
  }
}

/** 健康知识卡片分类 */
export type HealthTipCategory = 'eye' | 'posture' | 'water' | 'exercise' | 'mindful'

/** 正念与专注设置 */
export interface MindfulnessSettings {
  mindfulGuide: {
    enabled: boolean // 默认 true
    showInLongBreak: boolean // 默认 true
  }
  healthTips: {
    enabled: boolean // 默认 true
    categories: HealthTipCategory[] // 默认全选
  }
  workEndReminder: {
    enabled: boolean // 默认 true
    time: string // 默认 "18:00"
    postponeMinutes: number // 延后分钟数，默认 30
  }
}

export interface AppSettings {
  general: GeneralSettings
  reminder: ReminderSettings
  smart: SmartSettings
  water: WaterReminderSettings
  exercise: ExerciseSettings
  mindfulness: MindfulnessSettings
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
  TIMER_TAKE_BREAK_WITH_MODE: 'timer:take-break-with-mode',
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
  STATS_GET_STREAK: 'stats:get-streak',

  // 喝水
  WATER_RECORD: 'water:record',
  WATER_GET_TODAY: 'water:get-today',
  WATER_GET_RANGE: 'water:get-range',
  WATER_GET_STREAK: 'water:get-streak',

  // 运动
  EXERCISE_RECORD: 'exercise:record',
  EXERCISE_GET_TODAY: 'exercise:get-today',
  EXERCISE_GET_RANGE: 'exercise:get-range',
  EXERCISE_GET_STREAK: 'exercise:get-streak',

  // 正念 / 健康卡片 / 下班提醒
  WORK_END_CHECK: 'workEnd:check',
  WORK_END_POSTPONE: 'workEnd:postpone',
  WORK_END_DISMISS: 'workEnd:dismiss',

  // 应用
  APP_QUIT: 'app:quit',
  APP_GET_VERSION: 'app:get-version',

  // 防作弊: 活动检测重置
  BREAK_ACTIVITY_DETECTED: 'break:activity-detected',

  // 设置变更通知
  SETTINGS_CHANGED: 'settings:changed'
} as const

// ---- 默认设置 ----

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    autoLaunch: false,
    language: 'zh-CN',
    theme: 'system',
    shortcutsEnabled: false,
    globalShortcuts: {
      togglePause: 'CommandOrControl+Shift+P',
      takeBreak: 'CommandOrControl+Shift+B',
      skipBreak: 'CommandOrControl+Shift+S'
    }
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
    skipButtonDelay: 5,
    restScreen: {
      miniBreakMode: 'classic',
      longBreakMode: 'nature',
      ambientSoundEnabled: true,
      ambientSoundType: 'birds'
    }
  },
  smart: {
    idleDetectionEnabled: true,
    idleThreshold: 5,
    mediaActivityDetection: true,
    dndAware: true,
    fullscreenDetection: true,
    strictMode: false,
    workSchedule: {
      enabled: false,
      startTime: '09:00',
      endTime: '18:00',
      daysOfWeek: [1, 2, 3, 4, 5]
    }
  },
  water: {
    enabled: true,
    dailyGoal: 2000,
    quickAmounts: [250, 500, 750],
    showInBreak: true,
    independentReminder: false,
    reminderInterval: 90
  },
  exercise: {
    sedentaryReminder: {
      enabled: true,
      threshold: 30
    },
    standReminder: {
      enabled: true,
      interval: 60
    },
    stretchGuide: {
      enabled: true,
      showInLongBreak: true
    }
  },
  mindfulness: {
    mindfulGuide: {
      enabled: true,
      showInLongBreak: true
    },
    healthTips: {
      enabled: true,
      categories: ['eye', 'posture', 'water', 'exercise', 'mindful']
    },
    workEndReminder: {
      enabled: true,
      time: '18:00',
      postponeMinutes: 30
    }
  },
  firstRun: true
}
