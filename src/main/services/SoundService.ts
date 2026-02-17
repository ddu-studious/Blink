// ========================================
// 声音提示服务 - 休息开始/结束提示音
// ========================================

import { BrowserWindow } from 'electron'
import { settingsStore } from '../store/SettingsStore'
import log from 'electron-log'

/**
 * 声音服务
 * 通过渲染进程 Web Audio API 播放提示音
 * 使用合成音效，无需外部音频文件
 */
class SoundService {
  /** 在指定窗口中播放提示音 */
  private playInWindow(win: BrowserWindow, soundType: 'break-start' | 'break-end'): void {
    const settings = settingsStore.getAll()
    if (!settings.reminder.soundEnabled) return

    const volume = settings.reminder.soundVolume / 100

    // 注入 Web Audio API 代码到渲染进程播放声音
    const audioCode = soundType === 'break-start'
      ? this.getBreakStartSound(volume)
      : this.getBreakEndSound(volume)

    try {
      win.webContents.executeJavaScript(audioCode).catch(() => {
        // 忽略播放失败 (窗口可能已关闭)
      })
    } catch {
      // 忽略
    }
  }

  /** 在所有窗口播放提示音 */
  play(soundType: 'break-start' | 'break-end'): void {
    const settings = settingsStore.getAll()
    if (!settings.reminder.soundEnabled) return

    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      // 只在第一个非销毁的窗口播放
      const win = windows.find(w => !w.isDestroyed())
      if (win) {
        this.playInWindow(win, soundType)
        log.debug(`[SoundService] 播放提示音: ${soundType}`)
      }
    }
  }

  /** 休息开始 - 柔和的两声提示 */
  private getBreakStartSound(volume: number): string {
    return `
      (function() {
        try {
          const ctx = new AudioContext();
          const now = ctx.currentTime;

          // 第一声 - C5 (523Hz)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.value = 523;
          gain1.gain.setValueAtTime(0, now);
          gain1.gain.linearRampToValueAtTime(${volume * 0.3}, now + 0.05);
          gain1.gain.linearRampToValueAtTime(0, now + 0.3);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.3);

          // 第二声 - E5 (659Hz)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.value = 659;
          gain2.gain.setValueAtTime(0, now + 0.2);
          gain2.gain.linearRampToValueAtTime(${volume * 0.3}, now + 0.25);
          gain2.gain.linearRampToValueAtTime(0, now + 0.6);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.2);
          osc2.stop(now + 0.6);

          setTimeout(() => ctx.close(), 1000);
        } catch(e) {}
      })();
    `
  }

  /** 休息结束 - 轻快的下行音 */
  private getBreakEndSound(volume: number): string {
    return `
      (function() {
        try {
          const ctx = new AudioContext();
          const now = ctx.currentTime;

          // G5 → E5 → C5 快速下行
          const notes = [784, 659, 523];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = now + i * 0.12;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(${volume * 0.25}, start + 0.03);
            gain.gain.linearRampToValueAtTime(0, start + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.2);
          });

          setTimeout(() => ctx.close(), 1000);
        } catch(e) {}
      })();
    `
  }
}

export const soundService = new SoundService()
