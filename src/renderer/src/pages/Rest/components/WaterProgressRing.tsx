import { useState, useEffect, useMemo } from 'react'

interface WaterProgressRingProps {
  totalMl: number
  dailyGoal: number
  isLongBreak: boolean
  quickAmounts: number[]
  onRecord: (amount: number) => void
}

const CIRCUMFERENCE = 2 * Math.PI * 40

export default function WaterProgressRing({
  totalMl,
  dailyGoal,
  isLongBreak,
  quickAmounts,
  onRecord
}: WaterProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [showToast, setShowToast] = useState('')

  const progress = Math.min(totalMl / dailyGoal, 1)
  const cups = Math.round(totalMl / 250)
  const goalCups = Math.round(dailyGoal / 250)
  const remaining = Math.max(goalCups - cups, 0)
  const isComplete = totalMl >= dailyGoal

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 300)
    return () => clearTimeout(timer)
  }, [progress])

  const strokeDashoffset = useMemo(
    () => CIRCUMFERENCE * (1 - animatedProgress),
    [animatedProgress]
  )

  const handleRecord = (amount: number) => {
    onRecord(amount)
    setShowToast(`+${amount}ml 💧`)
    setTimeout(() => setShowToast(''), 1500)
  }

  if (isLongBreak) {
    return (
      <div className="flex flex-col items-center gap-4 my-2">
        {/* 圆环进度 + 信息 */}
        <div className="flex items-center gap-6">
          {/* 圆环 */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24" viewBox="0 0 96 96">
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="rgba(59,130,246,0.1)"
                strokeWidth="5"
              />
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="url(#waterGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 48 48)"
                className="transition-all duration-1000"
                style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />
              <defs>
                <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isComplete ? '#34d399' : '#60a5fa'} />
                  <stop offset="100%" stopColor={isComplete ? '#10b981' : '#3b82f6'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-lg font-light ${isComplete ? 'text-emerald-400' : 'text-white/90'}`}>
                {Math.round(progress * 100)}%
              </span>
              <span className="text-[9px] text-white/40">{totalMl}/{dailyGoal}ml</span>
            </div>
          </div>

          {/* 信息卡片 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-sm">💧</span>
              <div>
                <p className="text-xs text-white/70">{cups} 杯</p>
                <p className="text-[9px] text-white/30">
                  {isComplete ? '已达标！' : `还差 ${remaining} 杯`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 快速记录按钮 */}
        <div className="flex gap-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleRecord(amount)}
              className="px-3 py-1.5 text-xs text-blue-300/80 hover:text-blue-200 bg-blue-500/8 hover:bg-blue-500/15 border border-blue-400/20 hover:border-blue-400/40 rounded-lg transition-all duration-200"
            >
              +{amount}ml
            </button>
          ))}
        </div>

        {/* Toast */}
        {showToast && (
          <div className="text-xs text-blue-300/80 bg-blue-500/10 border border-blue-400/20 px-3 py-1 rounded-lg animate-fade-in">
            {showToast}
          </div>
        )}
      </div>
    )
  }

  // Mini Break: 精简的一行式提示
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 my-2">
      {/* 小圆环 */}
      <div className="relative w-9 h-9 flex-shrink-0">
        <svg className="w-9 h-9" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke={isComplete ? '#34d399' : '#60a5fa'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 14}`}
            strokeDashoffset={`${2 * Math.PI * 14 * (1 - animatedProgress)}`}
            transform="rotate(-90 18 18)"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white/60">
          💧
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/60">
          {isComplete ? '今日饮水已达标 ✓' : '顺便喝口水'}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isComplete ? 'bg-emerald-400' : 'bg-blue-400'
              }`}
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-white/40 tabular-nums">{cups}/{goalCups}杯</span>
        </div>
      </div>
    </div>
  )
}
