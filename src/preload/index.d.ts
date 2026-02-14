import { ElectronAPI } from '@electron-toolkit/preload'
import { AppSettings, TimerState } from '../main/types'
import { DailyStats } from '../main/store/StatsDatabase'

// 青眸 API 类型定义
interface QingMouAPI {
  timer: {
    start: () => Promise<TimerState>
    pause: () => Promise<TimerState>
    resume: () => Promise<TimerState>
    reset: () => Promise<TimerState>
    getState: () => Promise<TimerState>
    takeBreak: (type: 'mini' | 'long') => Promise<TimerState>
    onStateUpdate: (callback: (state: TimerState) => void) => () => void
  }
  break: {
    skip: () => Promise<TimerState>
  }
  settings: {
    get: () => Promise<AppSettings>
    set: (settings: Partial<AppSettings>) => Promise<AppSettings>
    reset: () => Promise<AppSettings>
  }
  stats: {
    getToday: () => Promise<DailyStats>
    getRange: (startDate: string, endDate: string) => Promise<DailyStats[]>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: QingMouAPI
  }
}
