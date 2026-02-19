// ========================================
// 系统托盘管理器
// ========================================

import { Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { RestScreenMode, TimerState, TimerStatus } from '../types'
import log from 'electron-log'

// 托盘菜单操作回调
export interface TrayCallbacks {
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onTakeBreak: () => void
  onTakeBreakWithMode?: (type: 'mini' | 'long', mode: RestScreenMode) => void
  onSkipToNext: () => void
  onShowSettings: () => void
  onShowDashboard: () => void
  onShowAbout: () => void
  onQuit: () => void
  onRecordWater?: (amount: number) => void
  onToggleWaterReminder?: () => void
}

export interface WaterProgress {
  totalMl: number
  dailyGoal: number
}

/**
 * 创建眼睛造型的 macOS 模板图标 (22x22, 黑色+透明)
 *
 * 使用 base64 编码的 PNG data URL，图案为简洁的眼睛轮廓+瞳孔
 * macOS 模板图标会自动适配暗色/亮色菜单栏
 */
function createTrayIcon(): Electron.NativeImage {
  // 22x22 眼睛图标 (模板图标: 黑色线条 + 透明背景)
  // 使用 Buffer 动态绘制一个简单但专业的眼睛图标
  const size = 22

  // 创建 RGBA 像素缓冲区 (22x22)
  const pixels = Buffer.alloc(size * size * 4, 0) // 全透明

  // 辅助函数: 设置像素点
  const setPixel = (x: number, y: number, alpha: number): void => {
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const offset = (y * size + x) * 4
    pixels[offset] = 0 // R (黑色)
    pixels[offset + 1] = 0 // G
    pixels[offset + 2] = 0 // B
    pixels[offset + 3] = alpha // A
  }

  // 辅助函数: 绘制抗锯齿圆
  const drawCircle = (cx: number, cy: number, r: number, fill: boolean): void => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx
        const dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (fill) {
          if (dist <= r) {
            const edge = r - dist
            const alpha = edge < 1 ? Math.round(edge * 255) : 255
            setPixel(x, y, alpha)
          }
        } else {
          const ringDist = Math.abs(dist - r)
          if (ringDist < 1.2) {
            const alpha = Math.round((1 - ringDist / 1.2) * 255)
            setPixel(x, y, Math.max(pixels[(y * size + x) * 4 + 3], alpha))
          }
        }
      }
    }
  }

  // 绘制眼睛外轮廓 (椭圆/杏仁形状)
  const centerX = 11
  const centerY = 11
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const dx = (x - centerX) / 9 // 水平半径 9
      const dy = (y - centerY) / 5.5 // 垂直半径 5.5
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ringDist = Math.abs(dist - 1)
      if (ringDist < 0.15) {
        const alpha = Math.round((1 - ringDist / 0.15) * 240)
        setPixel(x, y, Math.max(pixels[(y * size + x) * 4 + 3], alpha))
      }
    }
  }

  // 绘制虹膜 (外圆环)
  drawCircle(centerX, centerY, 4, false)

  // 绘制瞳孔 (实心圆)
  drawCircle(centerX, centerY, 2.2, true)

  // 绘制高光点 (在瞳孔上留一个透明高光)
  setPixel(10, 10, 0) // 左上高光 (透明)
  setPixel(10, 9, 0)

  // 创建 nativeImage (使用 createFromBuffer, RGBA 格式)
  const icon = nativeImage.createFromBuffer(pixels, {
    width: size,
    height: size
  })

  // macOS 设置为模板图标 (自动适配菜单栏颜色)
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true)
  }

  return icon
}

export class TrayManager {
  private tray: Tray | null = null
  private callbacks: TrayCallbacks
  private waterProgress: WaterProgress = { totalMl: 0, dailyGoal: 2000 }
  private waterEnabled: boolean = true
  private waterIndependentReminder: boolean = false

  constructor(callbacks: TrayCallbacks) {
    this.callbacks = callbacks
  }

  /** 创建系统托盘 */
  init(): void {
    let icon: Electron.NativeImage

    try {
      // 优先使用文件图标 (支持 Retina @2x)
      const iconPath = join(__dirname, '../../resources/icons/tray-icon.png')
      const icon2xPath = join(__dirname, '../../resources/icons/tray-icon@2x.png')
      const fileIcon = nativeImage.createFromPath(iconPath)

      if (!fileIcon.isEmpty()) {
        // 尝试加载 @2x Retina 版本
        const icon2x = nativeImage.createFromPath(icon2xPath)
        if (!icon2x.isEmpty()) {
          icon = nativeImage.createFromBuffer(icon2x.toPNG(), {
            width: 22,
            height: 22,
            scaleFactor: 2.0
          })
        } else {
          icon = fileIcon
        }

        if (process.platform === 'darwin') {
          icon.setTemplateImage(true)
        }
      } else {
        // 回退到编程生成的眼睛图标
        icon = createTrayIcon()
      }
    } catch {
      // 回退到编程生成的图标
      icon = createTrayIcon()
      log.warn('[TrayManager] 使用编程生成的托盘图标')
    }

    this.tray = new Tray(icon)
    this.tray.setToolTip('青眸 - 护眼提醒')

    this.updateMenu('idle')

    log.info('[TrayManager] 系统托盘已创建')
  }

  /** 根据计时器状态更新菜单 */
  updateMenu(status: TimerStatus): void {
    if (!this.tray) return

    const isRunning = status === 'running'
    const isPaused = status === 'paused'
    const isIdle = status === 'idle'

    const menuTemplate: Electron.MenuItemConstructorOptions[] = [
      {
        label: '青眸 护眼提醒',
        enabled: false
      },
      { type: 'separator' },
      // 运行控制
      {
        label: '开始护眼',
        click: () => this.callbacks.onStart(),
        visible: isIdle
      },
      {
        label: '暂停护眼',
        click: () => this.callbacks.onPause(),
        visible: isRunning
      },
      {
        label: '恢复护眼',
        click: () => this.callbacks.onResume(),
        visible: isPaused
      },
      {
        label: '立即休息',
        click: () => this.callbacks.onTakeBreak(),
        enabled: isRunning
      },
      ...(this.callbacks.onTakeBreakWithMode
        ? [
            {
              label: '🧘 健康活动',
              submenu: [
                {
                  label: '💪 立即拉伸',
                  click: () => this.callbacks.onTakeBreakWithMode!('long', 'stretch'),
                  enabled: isRunning || isIdle
                },
                {
                  label: '🕊️ 正念时刻',
                  click: () => this.callbacks.onTakeBreakWithMode!('long', 'mindful'),
                  enabled: isRunning || isIdle
                },
                {
                  label: '🫁 呼吸练习',
                  click: () => this.callbacks.onTakeBreakWithMode!('mini', 'breathing'),
                  enabled: isRunning || isIdle
                },
                {
                  label: '👁️ 眼部训练',
                  click: () => this.callbacks.onTakeBreakWithMode!('mini', 'eyeTraining'),
                  enabled: isRunning || isIdle
                }
              ]
            } as Electron.MenuItemConstructorOptions
          ]
        : []),
      { type: 'separator' },
      ...(this.waterEnabled && this.callbacks.onRecordWater
        ? [
            {
              label: `💧 记录喝水`,
              submenu: [
                { label: '250ml (一杯)', click: () => this.callbacks.onRecordWater!(250) },
                { label: '500ml (一瓶)', click: () => this.callbacks.onRecordWater!(500) },
                { label: '750ml (大杯)', click: () => this.callbacks.onRecordWater!(750) }
              ]
            } as Electron.MenuItemConstructorOptions,
            {
              label: `💧 今日: ${this.waterProgress.totalMl}/${this.waterProgress.dailyGoal}ml`,
              enabled: false
            } as Electron.MenuItemConstructorOptions,
            {
              label: this.waterIndependentReminder ? '🔔 定时提醒: 开启' : '🔕 定时提醒: 关闭',
              click: () => this.callbacks.onToggleWaterReminder?.()
            } as Electron.MenuItemConstructorOptions,
            { type: 'separator' as const } as Electron.MenuItemConstructorOptions
          ]
        : []),
      {
        label: '统计',
        click: () => this.callbacks.onShowDashboard()
      },
      {
        label: '设置',
        click: () => this.callbacks.onShowSettings()
      },
      { type: 'separator' },
      {
        label: '关于青眸',
        click: () => this.callbacks.onShowAbout()
      },
      {
        label: '退出青眸',
        click: () => this.callbacks.onQuit()
      }
    ]

    const contextMenu = Menu.buildFromTemplate(menuTemplate)
    this.tray.setContextMenu(contextMenu)
  }

  /** 更新托盘 tooltip 显示倒计时 */
  updateTooltip(state: TimerState): void {
    if (!this.tray) return

    let tooltip = '青眸'

    switch (state.status) {
      case 'running': {
        const mins = Math.floor(state.miniBreakRemaining / 60)
        const secs = state.miniBreakRemaining % 60
        tooltip = `青眸 - 距下次休息 ${mins}:${secs.toString().padStart(2, '0')}`
        break
      }
      case 'paused':
        tooltip = '青眸 - 已暂停'
        break
      case 'break':
        tooltip = `青眸 - 休息中 (${state.breakRemaining}秒)`
        break
      case 'idle':
        tooltip = '青眸 - 未启动'
        break
    }

    if (this.waterEnabled) {
      const cups = Math.round(this.waterProgress.totalMl / 250)
      const goalCups = Math.round(this.waterProgress.dailyGoal / 250)
      tooltip += ` | 💧 ${cups}/${goalCups}杯`
    }

    this.tray.setToolTip(tooltip)
  }

  /**
   * 更新菜单栏倒计时文字 (macOS 独有)
   *
   * 在菜单栏图标旁边仅显示倒计时数字，简洁直观。
   */
  updateTitle(state: TimerState): void {
    if (!this.tray) return

    // setTitle 仅 macOS 支持
    if (process.platform !== 'darwin') return

    let title = ''

    switch (state.status) {
      case 'running': {
        const mins = Math.floor(state.miniBreakRemaining / 60)
        const secs = state.miniBreakRemaining % 60
        title = ` ${mins}:${secs.toString().padStart(2, '0')}`
        break
      }
      case 'paused':
        title = ' ⏸'
        break
      case 'break': {
        const bMins = Math.floor(state.breakRemaining / 60)
        const bSecs = state.breakRemaining % 60
        if (bMins > 0) {
          title = ` 🌿${bMins}:${bSecs.toString().padStart(2, '0')}`
        } else {
          title = ` 🌿:${bSecs.toString().padStart(2, '0')}`
        }
        break
      }
      case 'idle':
        title = '' // 未启动时不显示文字
        break
    }

    this.tray.setTitle(title)
  }

  /** 更新喝水进度 */
  updateWaterProgress(progress: WaterProgress): void {
    this.waterProgress = progress
  }

  /** 设置喝水功能启用状态 */
  setWaterEnabled(enabled: boolean): void {
    this.waterEnabled = enabled
  }

  /** 设置独立喝水提醒状态 */
  setWaterIndependentReminder(enabled: boolean): void {
    this.waterIndependentReminder = enabled
  }

  /** 销毁托盘 */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
      log.info('[TrayManager] 系统托盘已销毁')
    }
  }
}
