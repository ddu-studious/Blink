// ========================================
// 免打扰模式检测模块
// ========================================

import { exec } from 'child_process'
import { EventEmitter } from 'events'
import { settingsStore } from '../store/SettingsStore'
import log from 'electron-log'

/**
 * 免打扰 (Do Not Disturb) 模式检测
 *
 * macOS: 通过检查 Focus/DND 状态
 * Windows: 通过检查 Focus Assist 状态
 * Linux: 暂不支持
 */
export class DndDetector extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private wasDnd = false

  /** 启动免打扰检测 */
  start(): void {
    if (this.checkInterval) return

    // 每 60 秒检查一次免打扰状态
    this.checkInterval = setInterval(() => this.check(), 60 * 1000)
    // 启动时立即检查一次
    this.check()

    log.info('[DndDetector] 免打扰检测已启动')
  }

  /** 停止检测 */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /** 检查免打扰状态 */
  private async check(): Promise<void> {
    const settings = settingsStore.getAll()
    if (!settings.smart.dndAware) return

    try {
      const isDnd = await this.isDndEnabled()

      if (isDnd && !this.wasDnd) {
        this.wasDnd = true
        log.info('[DndDetector] 免打扰模式已开启')
        this.emit('dnd-change', true)
      } else if (!isDnd && this.wasDnd) {
        this.wasDnd = false
        log.info('[DndDetector] 免打扰模式已关闭')
        this.emit('dnd-change', false)
      }
    } catch {
      // 检测失败时忽略
    }
  }

  /** 检测系统免打扰状态 */
  private isDndEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      if (process.platform === 'darwin') {
        // macOS: 检查 Focus 模式状态
        // 通过 defaults 读取 assertionTypeStateByProfileId 判断是否有活跃的 Focus
        exec(
          'defaults read com.apple.controlcenter "NSStatusItem Visible FocusModes" 2>/dev/null || echo "0"',
          (error, stdout) => {
            if (error) {
              resolve(false)
              return
            }
            // 当 FocusModes 状态项可见时，通常表示 Focus 模式已启用
            // 更可靠的方式：检查是否有活跃的 Focus assertion
            exec(
              'plutil -extract dnd_prefs xml1 -o - ~/Library/DoNotDisturb/DB/Assertions/v2/storeAssertionRecords 2>/dev/null | grep -c "storeAssertionRecords" || echo "0"',
              (err2, stdout2) => {
                if (err2) {
                  resolve(false)
                  return
                }
                resolve(parseInt(stdout2.trim(), 10) > 0)
              }
            )
          }
        )
      } else if (process.platform === 'win32') {
        // Windows: 检查 Focus Assist / Quiet Hours
        exec(
          'powershell -Command "Get-ItemProperty -Path \'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\' -Name \'NOC_GLOBAL_SETTING_TOASTS_ENABLED\' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty NOC_GLOBAL_SETTING_TOASTS_ENABLED"',
          (error, stdout) => {
            if (error) {
              resolve(false)
              return
            }
            // 值为 0 表示通知已禁用 (免打扰开启)
            resolve(stdout.trim() === '0')
          }
        )
      } else {
        // Linux 暂不支持
        resolve(false)
      }
    })
  }

  /** 销毁 */
  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}

export const dndDetector = new DndDetector()
