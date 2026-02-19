// ========================================
// 媒体活动检测模块
// ========================================
//
// 通过检测系统电源断言（Power Assertions）判断是否有应用
// 在防止显示器休眠，覆盖以下场景：
// - 浏览器播放视频（YouTube、B站、Netflix 等）
// - 视频播放器（VLC、IINA 等）
// - 在线会议（Zoom、腾讯会议、钉钉等）
// - PPT 演示模式
//
// macOS: pmset -g assertions → PreventUserIdleDisplaySleep
// Windows: powercfg /requests → DISPLAY

import { exec } from 'child_process'
import { EventEmitter } from 'events'
import { settingsStore } from '../store/SettingsStore'
import log from 'electron-log'

export class MediaActivityDetector extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private _isMediaActive = false

  get isMediaActive(): boolean {
    return this._isMediaActive
  }

  start(): void {
    if (this.checkInterval) return

    this.checkInterval = setInterval(() => this.check(), 30 * 1000)
    this.check()

    log.info('[MediaActivityDetector] 媒体活动检测已启动')
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private async check(): Promise<void> {
    const settings = settingsStore.getAll()
    if (!settings.smart.mediaActivityDetection) return

    try {
      const isActive = await this.detectMediaActivity()

      if (isActive !== this._isMediaActive) {
        this._isMediaActive = isActive
        this.emit('media-activity-change', isActive)
        log.info(`[MediaActivityDetector] 媒体活动状态: ${isActive ? '活跃' : '无'}`)
      }
    } catch {
      // 检测失败时保持原状态
    }
  }

  private detectMediaActivity(): Promise<boolean> {
    if (process.platform === 'darwin') {
      return this.detectMacOS()
    } else if (process.platform === 'win32') {
      return this.detectWindows()
    }
    return Promise.resolve(false)
  }

  /**
   * macOS: 通过 pmset -g assertions 检测 PreventUserIdleDisplaySleep
   *
   * 当浏览器播放视频、视频播放器运行、会议软件活跃时，
   * 系统会注册 NoDisplaySleepAssertion 防止显示器休眠。
   */
  private detectMacOS(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('pmset -g assertions 2>/dev/null', { timeout: 5000 }, (error, stdout) => {
        if (error) {
          resolve(false)
          return
        }

        // 检查系统级断言状态
        const displaySleepMatch = stdout.match(/PreventUserIdleDisplaySleep\s+(\d+)/)
        if (displaySleepMatch && parseInt(displaySleepMatch[1]) > 0) {
          // 排除自身应用 — 检查是否有非青眸的进程持有断言
          const lines = stdout.split('\n')
          const hasExternalAssertion = lines.some((line) => {
            const isAssertion =
              line.includes('NoDisplaySleepAssertion') ||
              line.includes('PreventUserIdleDisplaySleep')
            const isOwnApp =
              line.includes('QingMou') || line.includes('qingmou') || line.includes('Electron')
            return isAssertion && !isOwnApp && line.includes('pid')
          })

          resolve(hasExternalAssertion)
          return
        }

        resolve(false)
      })
    })
  }

  /**
   * Windows: 通过 powercfg /requests 检测 DISPLAY 请求
   */
  private detectWindows(): Promise<boolean> {
    return new Promise((resolve) => {
      exec('powercfg /requests 2>nul', { timeout: 5000 }, (error, stdout) => {
        if (error) {
          resolve(false)
          return
        }

        // 查找 DISPLAY: 段落中的非 None 内容
        const displaySection = stdout.match(/DISPLAY:\s*\n([\s\S]*?)(?=\n\w+:|$)/)
        if (displaySection) {
          const content = displaySection[1].trim()
          const hasRequest = content !== '' && !content.match(/^None\.?$/i)
          resolve(hasRequest)
          return
        }

        resolve(false)
      })
    })
  }

  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}
