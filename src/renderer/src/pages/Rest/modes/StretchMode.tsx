// ========================================
// 拉伸引导模式 - 办公室拉伸动作引导
// ========================================

import { useState, useEffect, useRef } from 'react'
import { getRandomStretch, type StretchAction } from '../../../data/stretches'

interface StretchModeProps {
  remaining: number
  formatTime: (s: number) => string
  showSkip: boolean
  onSkip: () => void
  waterOverlay?: React.ReactNode
}

export default function StretchMode({ remaining, formatTime, showSkip, onSkip, waterOverlay }: StretchModeProps) {
  const [currentStretch, setCurrentStretch] = useState<StretchAction>(() => getRandomStretch())
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const hasRecorded = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasRecorded.current) {
        recordCurrentStretch()
      }
      setCurrentStretch(getRandomStretch())
      setCompletedSteps(new Set())
      hasRecorded.current = false
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const recordCurrentStretch = () => {
    if (hasRecorded.current) return
    hasRecorded.current = true
    window.api.exercise
      .record('stretch', currentStretch.name, currentStretch.duration, 'break')
      .catch(() => {})
  }

  const handleNextStretch = () => {
    if (completedSteps.size > 0 && !hasRecorded.current) {
      recordCurrentStretch()
    }
    setCurrentStretch(getRandomStretch())
    setCompletedSteps(new Set())
    hasRecorded.current = false
  }

  const handleStepComplete = (stepIndex: number) => {
    const newCompleted = new Set([...completedSteps, stepIndex])
    setCompletedSteps(newCompleted)

    if (newCompleted.size === currentStretch.steps.length && !hasRecorded.current) {
      recordCurrentStretch()
    }
  }

  const progress = currentStretch.steps.length > 0 
    ? (completedSteps.size / currentStretch.steps.length) * 100 
    : 0

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-pink-900/90 backdrop-blur-md">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-12">
        {/* 顶部标题栏 */}
        <div className="absolute top-8 left-0 right-0 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧘</span>
            <div>
              <h2 className="text-lg text-white/90 font-light">长休息 · 拉伸一下</h2>
              <p className="text-xs text-white/40 mt-0.5">让身体也放松放松</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-2xl font-extralight text-white tabular-nums">
                {formatTime(remaining)}
              </span>
            </div>
            {showSkip && (
              <button
                onClick={onSkip}
                className="px-4 py-2 text-sm text-white/40 hover:text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-lg transition-all"
              >
                跳过
              </button>
            )}
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 flex items-center justify-center w-full max-w-4xl">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 w-full max-w-2xl shadow-2xl">
            {/* 动作标题 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-1">{currentStretch.name}</h3>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span>🎯 {currentStretch.targetArea}</span>
                  <span>·</span>
                  <span>⏱ 建议时长: {currentStretch.duration} 秒</span>
                </div>
              </div>
              <button
                onClick={handleNextStretch}
                className="px-4 py-2 text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
              >
                下一个动作
              </button>
            </div>

            {/* 步骤列表 */}
            <div className="space-y-3 mb-6">
              {currentStretch.steps.map((step, index) => {
                const isCompleted = completedSteps.has(index)
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                      isCompleted
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <p className={`flex-1 text-white/90 leading-relaxed ${isCompleted ? 'line-through opacity-60' : ''}`}>
                      {step}
                    </p>
                    {!isCompleted && (
                      <button
                        onClick={() => handleStepComplete(index)}
                        className="px-3 py-1 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all"
                      >
                        完成
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50">完成进度</span>
                <span className="text-sm font-medium text-white/70">
                  {completedSteps.size} / {currentStretch.steps.length}
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 注意事项 */}
            {currentStretch.tips && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-200/80">💡 {currentStretch.tips}</p>
              </div>
            )}

            {/* 喝水进度 */}
            {waterOverlay && <div className="mt-6">{waterOverlay}</div>}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-xs text-white/30">
            长休息时进行拉伸，可以有效缓解久坐带来的身体疲劳
          </p>
        </div>
      </div>
    </div>
  )
}
