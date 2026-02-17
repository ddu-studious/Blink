// ========================================
// 互动眼部训练模式
// 包含: 8字追踪、时钟运动、焦点切换、掌敷法
// ========================================

import { useState, useEffect } from 'react'

interface EyeTrainingModeProps {
  remaining: number
  formatTime: (s: number) => string
  showSkip: boolean
  onSkip: () => void
}

type TrainingType = 'figure8' | 'clock' | 'focusChange' | 'palming'

const TRAININGS: { type: TrainingType; label: string; icon: string }[] = [
  { type: 'figure8', label: '8字追踪', icon: '∞' },
  { type: 'clock', label: '时钟运动', icon: '🕐' },
  { type: 'focusChange', label: '焦点切换', icon: '🎯' },
  { type: 'palming', label: '掌敷法', icon: '🤲' }
]

export default function EyeTrainingMode({
  remaining,
  formatTime,
  showSkip,
  onSkip
}: EyeTrainingModeProps) {
  const [activeTraining, setActiveTraining] = useState<TrainingType>('figure8')
  const [groupIndex, setGroupIndex] = useState(0)
  const totalGroups = 4

  // 每 10 秒切换一组
  useEffect(() => {
    const interval = setInterval(() => {
      setGroupIndex((prev) => {
        if (prev >= totalGroups - 1) return 0
        return prev + 1
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 flex items-center justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/5 blur-[60px]" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6 animate-fade-in">
        <p className="text-xs text-white/20 tracking-[0.4em] uppercase">Eye Training</p>

        {/* 训练模式选择 */}
        <div className="flex gap-2">
          {TRAININGS.map((t) => (
            <button
              key={t.type}
              onClick={() => {
                setActiveTraining(t.type)
                setGroupIndex(0)
              }}
              className={`px-3 py-1.5 text-[11px] rounded-lg transition-all ${
                activeTraining === t.type
                  ? 'text-sky-400 bg-sky-400/10 border border-sky-400/30'
                  : 'text-white/25 bg-white/[0.03] border border-white/[0.06] hover:text-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 训练区域 */}
        <div className="relative w-64 h-48 flex items-center justify-center">
          {activeTraining === 'figure8' && <Figure8Training />}
          {activeTraining === 'clock' && <ClockTraining />}
          {activeTraining === 'focusChange' && <FocusChangeTraining />}
          {activeTraining === 'palming' && <PalmingGuide />}
        </div>

        {/* 说明文字 */}
        <div className="space-y-2">
          <p className="text-base text-white/60 font-light">
            {activeTraining === 'figure8' && '跟随蓝点，用眼球描绘 8 字形'}
            {activeTraining === 'clock' && '跟随蓝点，按时钟方向转动眼球'}
            {activeTraining === 'focusChange' && '交替看近处和远处，锻炼调焦能力'}
            {activeTraining === 'palming' && '搓热双手，轻轻敷在闭合的眼睛上'}
          </p>
          <p className="text-xs text-white/25">
            第 {groupIndex + 1}/{totalGroups} 组 · 保持头部不动
          </p>
        </div>

        {/* 进度条 */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalGroups }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-1 rounded-full ${
                i <= groupIndex ? 'bg-sky-500' : 'bg-white/10'
              } transition-colors`}
            />
          ))}
        </div>

        {/* 底部 */}
        <div className="flex items-center gap-4">
          <span className="text-xl font-extralight text-white/30 tabular-nums">
            {formatTime(remaining)}
          </span>
          {showSkip && (
            <button
              onClick={onSkip}
              className="px-4 py-1.5 text-xs text-white/20 hover:text-white/50 border border-white/5 hover:border-white/15 rounded-full transition-all"
            >
              退出训练
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- 训练子组件 ----

function Figure8Training() {
  const [pos, setPos] = useState({ x: 0, y: -35 })

  useEffect(() => {
    let t = 0
    const interval = setInterval(() => {
      t += 0.02
      // 8字 (Lissajous curve)
      const x = 40 * Math.sin(t)
      const y = 35 * Math.sin(2 * t)
      setPos({ x, y })
    }, 30)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* 8字轨迹 */}
      <svg className="absolute inset-0 w-full h-full" viewBox="-60 -50 120 100">
        <path
          d="M0,-35 C25,-35 40,-15 40,0 C40,15 25,35 0,35 C-25,35 -40,15 -40,0 C-40,-15 -25,-35 0,-35"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      </svg>
      {/* 追踪圆点 */}
      <div
        className="absolute w-5 h-5 rounded-full bg-sky-400 shadow-lg shadow-sky-500/50"
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
          transition: 'none'
        }}
      />
      {/* 中心十字 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/10 border border-white/20" />
    </>
  )
}

function ClockTraining() {
  const [angle, setAngle] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAngle((prev) => (prev + 1.5) % 360)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const radius = 60
  const x = radius * Math.cos(((angle - 90) * Math.PI) / 180)
  const y = radius * Math.sin(((angle - 90) * Math.PI) / 180)

  return (
    <>
      {/* 圆形轨道 */}
      <div className="absolute inset-6 border-2 border-dashed border-white/10 rounded-full" />
      {/* 12/3/6/9 方位 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/15 text-[10px]">12</div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/15 text-[10px]">3</div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/15 text-[10px]">
        6
      </div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/15 text-[10px]">9</div>
      {/* 追踪圆点 */}
      <div
        className="absolute w-5 h-5 rounded-full bg-sky-400 shadow-lg shadow-sky-500/50"
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
        }}
      />
      {/* 中心 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/10 border border-white/20" />
    </>
  )
}

function FocusChangeTraining() {
  const [isNear, setIsNear] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsNear((prev) => !prev)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6">
      <div
        className={`rounded-full bg-sky-400/30 border-2 border-sky-400/40 flex items-center justify-center transition-all duration-1000 ease-in-out ${
          isNear ? 'w-24 h-24' : 'w-8 h-8'
        }`}
      >
        <div
          className={`rounded-full bg-sky-400 transition-all duration-1000 ${
            isNear ? 'w-12 h-12' : 'w-3 h-3'
          }`}
        />
      </div>
      <p className="text-sm text-white/40 transition-opacity">
        {isNear ? '👆 注视近处的圆点' : '👀 想象看向窗外最远处'}
      </p>
    </div>
  )
}

function PalmingGuide() {
  const [step, setStep] = useState(0)
  const steps = ['搓热双手 10 秒', '闭上眼睛', '手掌轻敷眼部', '深呼吸，感受温暖']

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6">
      <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-400/20 flex items-center justify-center">
        <span className="text-4xl">🤲</span>
      </div>
      <div className="text-center space-y-2">
        <p className="text-base text-white/60 font-light">{steps[step]}</p>
        <div className="flex gap-1.5 justify-center">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-6 h-0.5 rounded-full ${
                i === step ? 'bg-amber-400/60' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
