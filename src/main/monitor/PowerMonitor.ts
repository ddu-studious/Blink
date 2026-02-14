// ========================================
// 电源监控模块 - 休眠/唤醒/锁屏
// ========================================

import { powerMonitor } from 'electron'
import { EventEmitter } from 'events'
import log from 'electron-log'

export class PowerMonitorService extends EventEmitter {
  /** 初始化电源监听 */
  init(): void {
    // 系统挂起 (休眠/睡眠)
    powerMonitor.on('suspend', () => {
      log.info('[PowerMonitor] 系统挂起')
      this.emit('suspend')
    })

    // 系统恢复
    powerMonitor.on('resume', () => {
      log.info('[PowerMonitor] 系统恢复')
      this.emit('resume')
    })

    // 锁屏
    powerMonitor.on('lock-screen', () => {
      log.info('[PowerMonitor] 屏幕锁定')
      this.emit('lock-screen')
    })

    // 解锁
    powerMonitor.on('unlock-screen', () => {
      log.info('[PowerMonitor] 屏幕解锁')
      this.emit('unlock-screen')
    })

    log.info('[PowerMonitor] 电源监控已初始化')
  }

  /** 销毁 */
  destroy(): void {
    this.removeAllListeners()
  }
}
