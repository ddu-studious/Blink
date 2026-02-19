import { ElectronAPI } from '@electron-toolkit/preload'
import { AppSettings, TimerState } from '../main/types'
import { DailyStats, WaterDailyStats, ExerciseDailyStats } from '../main/store/StatsDatabase'

// 青眸 API 类型定义
interface QingMouAPI {
  timer: {
    start: () => Promise<TimerState>
    pause: () => Promise<TimerState>
    resume: () => Promise<TimerState>
    reset: () => Promise<TimerState>
    getState: () => Promise<TimerState>
    takeBreak: (type: 'mini' | 'long') => Promise<TimerState>
    takeBreakWithMode: (type: 'mini' | 'long', mode: string) => Promise<TimerState>
    onStateUpdate: (callback: (state: TimerState) => void) => () => void
  }
  break: {
    skip: () => Promise<TimerState>
    activityDetected: () => Promise<TimerState>
  }
  settings: {
    get: () => Promise<AppSettings>
    set: (settings: Partial<AppSettings>) => Promise<AppSettings>
    reset: () => Promise<AppSettings>
  }
  stats: {
    getToday: () => Promise<DailyStats>
    getRange: (startDate: string, endDate: string) => Promise<DailyStats[]>
    getStreak: () => Promise<number>
  }
  water: {
    record: (amount: number, source?: string) => Promise<WaterDailyStats>
    getToday: () => Promise<WaterDailyStats>
    getRange: (startDate: string, endDate: string) => Promise<WaterDailyStats[]>
    getStreak: () => Promise<number>
  }
  exercise: {
    record: (exerciseType: 'stand' | 'stretch' | 'mindful', exerciseName?: string, duration?: number, source?: string) => Promise<ExerciseDailyStats>
    getToday: () => Promise<ExerciseDailyStats>
    getRange: (startDate: string, endDate: string) => Promise<ExerciseDailyStats[]>
    getStreak: () => Promise<number>
  }
  workEnd: {
    postpone: () => Promise<{ success: boolean }>
    dismiss: () => Promise<{ success: boolean }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: QingMouAPI
  }
}
