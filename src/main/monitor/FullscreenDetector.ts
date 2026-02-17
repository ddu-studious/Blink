// ========================================
// 全屏应用检测模块
// ========================================

import { exec } from 'child_process'
import { BrowserWindow } from 'electron'
import { EventEmitter } from 'events'
import { settingsStore } from '../store/SettingsStore'
import log from 'electron-log'

/**
 * 全屏应用检测
 *
 * 当检测到非本应用的全屏应用（如演示、视频播放器、游戏）时，
 * 暂停休息提醒以免打扰用户。
 *
 * macOS: 通过 CGWindowListCopyWindowInfo 检测全屏窗口
 * Windows: 通过检查前台窗口是否全屏
 * Linux: 暂不支持
 */
export class FullscreenDetector extends EventEmitter {
  private checkInterval: NodeJS.Timeout | null = null
  private wasFullscreen = false

  /** 启动全屏应用检测 */
  start(): void {
    if (this.checkInterval) return

    // 每 30 秒检查一次全屏状态
    this.checkInterval = setInterval(() => this.check(), 30 * 1000)
    // 启动时立即检查一次
    this.check()

    log.info('[FullscreenDetector] 全屏应用检测已启动')
  }

  /** 停止检测 */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /** 检查全屏应用状态 */
  private async check(): Promise<void> {
    const settings = settingsStore.getAll()
    if (!settings.smart.fullscreenDetection) return

    try {
      const isFullscreen = await this.isFullscreenAppRunning()

      if (isFullscreen && !this.wasFullscreen) {
        this.wasFullscreen = true
        log.info('[FullscreenDetector] 检测到全屏应用')
        this.emit('fullscreen-change', true)
      } else if (!isFullscreen && this.wasFullscreen) {
        this.wasFullscreen = false
        log.info('[FullscreenDetector] 全屏应用已退出')
        this.emit('fullscreen-change', false)
      }
    } catch {
      // 检测失败时忽略
    }
  }

  /** 检测是否有非本应用的全屏窗口 */
  private isFullscreenAppRunning(): Promise<boolean> {
    return new Promise((resolve) => {
      // 排除本应用的窗口
      const ownWindowIds = BrowserWindow.getAllWindows()
        .filter((w) => !w.isDestroyed())
        .map((w) => w.id)

      if (process.platform === 'darwin') {
        // macOS: 使用 AppleScript 检测是否有应用处于全屏模式
        // 通过检查屏幕上当前 Space 中是否有全屏窗口
        exec(
          `osascript -e '
            tell application "System Events"
              set frontApp to name of first application process whose frontmost is true
              set frontAppPID to unix id of first application process whose frontmost is true
            end tell
            do shell script "python3 -c \\"
import Quartz
import sys

options = Quartz.kCGWindowListOptionOnScreenOnly | Quartz.kCGWindowListExcludeDesktopElements
windowList = Quartz.CGWindowListCopyWindowInfo(options, Quartz.kCGNullWindowID)

for window in windowList:
    bounds = window.get('kCGWindowBounds', {})
    ownerPID = window.get('kCGWindowOwnerPID', 0)
    layer = window.get('kCGWindowLayer', 0)
    
    # Check if window fills the main screen (approximate fullscreen detection)
    if bounds.get('Width', 0) >= 1280 and bounds.get('Height', 0) >= 720 and layer == 0:
        # Exclude our own app PID
        if ownerPID != int(sys.argv[1]):
            print('FULLSCREEN')
            sys.exit(0)
print('NORMAL')
\\" ${frontAppPID}"
          '`,
          { timeout: 5000 },
          (error, stdout) => {
            if (error) {
              // 如果 AppleScript 失败，使用更简单的回退方案
              this.checkFullscreenSimple().then(resolve)
              return
            }
            resolve(stdout.trim().includes('FULLSCREEN'))
          }
        )
      } else if (process.platform === 'win32') {
        // Windows: 检查前台窗口是否全屏
        exec(
          `powershell -Command "
            Add-Type @'
            using System;
            using System.Runtime.InteropServices;
            public class FullscreenCheck {
              [DllImport("user32.dll")]
              public static extern IntPtr GetForegroundWindow();
              [DllImport("user32.dll")]
              public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
              [DllImport("user32.dll")]
              public static extern int GetSystemMetrics(int nIndex);
              [StructLayout(LayoutKind.Sequential)]
              public struct RECT { public int Left, Top, Right, Bottom; }
            }
'@
            $hwnd = [FullscreenCheck]::GetForegroundWindow()
            $rect = New-Object FullscreenCheck+RECT
            [FullscreenCheck]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
            $screenW = [FullscreenCheck]::GetSystemMetrics(0)
            $screenH = [FullscreenCheck]::GetSystemMetrics(1)
            $w = $rect.Right - $rect.Left
            $h = $rect.Bottom - $rect.Top
            if ($w -ge $screenW -and $h -ge $screenH) { 'FULLSCREEN' } else { 'NORMAL' }
          "`,
          { timeout: 5000 },
          (error, stdout) => {
            if (error) {
              resolve(false)
              return
            }
            resolve(stdout.trim() === 'FULLSCREEN')
          }
        )
      } else {
        // Linux 暂不支持
        resolve(false)
      }
    })
  }

  /** 简单的全屏检测回退方案 (macOS) */
  private checkFullscreenSimple(): Promise<boolean> {
    return new Promise((resolve) => {
      // 使用简单的 AppleScript 检查前台应用是否全屏
      exec(
        `osascript -e 'tell application "System Events" to get value of attribute "AXFullScreen" of window 1 of (first application process whose frontmost is true)' 2>/dev/null || echo "false"`,
        { timeout: 3000 },
        (error, stdout) => {
          if (error) {
            resolve(false)
            return
          }
          resolve(stdout.trim() === 'true')
        }
      )
    })
  }

  /** 销毁 */
  destroy(): void {
    this.stop()
    this.removeAllListeners()
  }
}
