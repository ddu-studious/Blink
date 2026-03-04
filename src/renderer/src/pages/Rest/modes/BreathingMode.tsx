// ========================================
// 引导呼吸/冥想模式
// 吸气 4s → 屏住 4s → 呼气 6s = 14s 一个循环
// ========================================

import { useState, useEffect } from 'react'

interface BreathingModeProps {
  remaining: number
  formatTime: (s: number) => string
  showSkip: boolean
  onSkip: () => void
  onOpenSettings?: () => void
}

type BreathPhase = 'inhale' | 'hold' | 'exhale'

const PHASES: { phase: BreathPhase; duration: number; label: string }[] = [
  { phase: 'inhale', duration: 4, label: '吸气...' },
  { phase: 'hold', duration: 4, label: '屏住...' },
  { phase: 'exhale', duration: 6, label: '呼气...' }
]

const TOTAL_CYCLE = PHASES.reduce((s, p) => s + p.duration, 0) // 14s

export default function BreathingMode({
  remaining,
  formatTime,
  showSkip,
  onSkip,
  onOpenSettings
}: BreathingModeProps) {
  const [phase, setPhase] = useState<BreathPhase>('inhale')
  const [phaseLabel, setPhaseLabel] = useState('吸气...')
  const [countdown, setCountdown] = useState(4)
  const [scale, setScale] = useState(0.6)

  // 呼吸节拍控制
  useEffect(() => {
    let elapsed = 0
    const interval = setInterval(() => {
      elapsed++
      const cyclePos = elapsed % TOTAL_CYCLE

      // 确定当前阶段
      let accumulated = 0
      for (const p of PHASES) {
        accumulated += p.duration
        if (cyclePos < accumulated) {
          setPhase(p.phase)
          setPhaseLabel(p.label)
          setCountdown(accumulated - cyclePos)

          // 动态缩放值
          if (p.phase === 'inhale') {
            const progress = (cyclePos - (accumulated - p.duration)) / p.duration
            setScale(0.6 + 0.4 * progress)
          } else if (p.phase === 'hold') {
            setScale(1)
          } else {
            const progress = (cyclePos - (accumulated - p.duration)) / p.duration
            setScale(1 - 0.4 * progress)
          }
          break
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 阶段对应颜色
  const phaseColor =
    phase === 'inhale'
      ? 'from-teal-400/30 to-cyan-500/20'
      : phase === 'hold'
        ? 'from-cyan-400/30 to-blue-500/20'
        : 'from-blue-400/30 to-indigo-500/20'

  const ringColor =
    phase === 'inhale'
      ? 'border-teal-400/20'
      : phase === 'hold'
        ? 'border-cyan-400/20'
        : 'border-blue-400/20'

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
      {/* 微弱光晕背景 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/5 blur-[80px]" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-10 animate-fade-in">
        <p className="text-xs text-white/20 tracking-[0.4em] uppercase">Breathing Guide</p>

        {/* 呼吸圆环 */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* 外圈脉冲 */}
          <div
            className={`absolute inset-0 rounded-full border ${ringColor} transition-all duration-1000`}
            style={{ transform: `scale(${scale * 1.15})`, opacity: scale * 0.6 }}
          />
          <div
            className={`absolute inset-4 rounded-full border ${ringColor} transition-all duration-1000`}
            style={{ transform: `scale(${scale * 1.08})`, opacity: scale * 0.8 }}
          />
          {/* 核心呼吸球 */}
          <div
            className={`rounded-full bg-gradient-to-br ${phaseColor} backdrop-blur-sm border border-teal-400/20 shadow-lg shadow-teal-500/10 flex items-center justify-center transition-all duration-1000 ease-in-out`}
            style={{
              width: `${scale * 130}px`,
              height: `${scale * 130}px`
            }}
          >
            <div className="text-center">
              <p className="text-2xl text-teal-300/90 font-extralight">{phaseLabel}</p>
              <p className="text-xs text-teal-400/40 mt-1 tabular-nums">{countdown}</p>
            </div>
          </div>
        </div>

        {/* 呼吸节奏指示 */}
        <div className="flex items-center gap-4 text-xs text-white/20">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-3 h-3 rounded-full border ${
                phase === 'inhale'
                  ? 'bg-teal-500/50 border-teal-400/60'
                  : 'bg-teal-500/20 border-teal-400/30'
              } transition-colors`}
            />
            <span>吸气 4s</span>
          </div>
          <div className="w-4 h-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div
              className={`w-3 h-3 rounded-full border ${
                phase === 'hold'
                  ? 'bg-cyan-500/50 border-cyan-400/60'
                  : 'bg-cyan-500/20 border-cyan-400/30'
              } transition-colors`}
            />
            <span>屏住 4s</span>
          </div>
          <div className="w-4 h-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div
              className={`w-3 h-3 rounded-full border ${
                phase === 'exhale'
                  ? 'bg-blue-500/50 border-blue-400/60'
                  : 'bg-blue-500/20 border-blue-400/30'
              } transition-colors`}
            />
            <span>呼气 6s</span>
          </div>
        </div>

        {/* 底部倒计时 + 跳过 */}
        <div className="flex items-center gap-6">
          <span className="text-3xl font-extralight text-white/40 tabular-nums">
            {formatTime(remaining)}
          </span>
          {showSkip && (
            <button
              onClick={onSkip}
              className="px-5 py-1.5 text-xs text-white/20 hover:text-white/50 border border-white/5 hover:border-white/15 rounded-full transition-all"
            >
              跳过
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 text-xs text-white/15 hover:text-white/40 border border-white/5 hover:border-white/15 rounded-full transition-all"
              title="设置"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
