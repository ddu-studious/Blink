// ========================================
// 正念引导模式
// 跟随文字提示进行正念练习
// ========================================

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { getRandomMindfulExercise, type MindfulExercise } from '../../../data/mindfulness'
import { getRandomHealthTip, getCategoryIcon, type HealthTip } from '../../../data/healthTips'

interface MindfulModeProps {
  remaining: number
  formatTime: (s: number) => string
  showSkip: boolean
  onSkip: () => void
  waterOverlay: ReactNode
  healthTipCategories?: string[]
}

export default function MindfulMode({
  remaining,
  formatTime,
  showSkip,
  onSkip,
  waterOverlay,
  healthTipCategories
}: MindfulModeProps) {
  const [exercise] = useState<MindfulExercise>(() => getRandomMindfulExercise())
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepElapsed, setStepElapsed] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [breathScale, setBreathScale] = useState(0.6)
  const [healthTip] = useState<HealthTip>(() =>
    getRandomHealthTip(healthTipCategories as never[])
  )
  const hasRecorded = useRef(false)

  const currentStep = exercise.steps[currentStepIndex]
  const totalSteps = exercise.steps.length

  useEffect(() => {
    if (isComplete) return

    const interval = setInterval(() => {
      setStepElapsed((prev) => {
        const next = prev + 1
        if (next >= currentStep.duration) {
          if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex((i) => i + 1)
            return 0
          } else {
            setIsComplete(true)
            return prev
          }
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentStepIndex, currentStep, totalSteps, isComplete])

  // 呼吸动画（基于引导文字中的关键词）
  useEffect(() => {
    const text = currentStep?.text || ''
    if (text.includes('吸气') || text.includes('吸')) {
      setBreathScale(1.0)
    } else if (text.includes('屏住') || text.includes('保持')) {
      setBreathScale(0.95)
    } else if (text.includes('呼气') || text.includes('呼')) {
      setBreathScale(0.6)
    } else if (text.includes('放松') || text.includes('感受')) {
      setBreathScale(0.75)
    }
  }, [currentStepIndex, currentStep])

  // 练习完成后记录
  useEffect(() => {
    if (isComplete && !hasRecorded.current) {
      hasRecorded.current = true
      window.api.exercise
        .record('mindful' as never, exercise.name, exercise.totalDuration, 'break')
        .catch(() => {})
    }
  }, [isComplete, exercise])

  const stepProgress = currentStep ? stepElapsed / currentStep.duration : 0
  const overallProgress = ((currentStepIndex + stepProgress) / totalSteps) * 100

  const handleNextExercise = useCallback(() => {
    setIsComplete(false)
    setCurrentStepIndex(0)
    setStepElapsed(0)
    hasRecorded.current = false
  }, [])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 flex items-center justify-center">
      {/* 柔和的光晕 */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-indigo-500/5 blur-[80px]" />

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-lg px-6 animate-fade-in">
        {/* 标题 */}
        <p className="text-xs text-white/20 tracking-[0.4em] uppercase mb-2">Mindful Moment</p>
        <h2 className="text-sm text-violet-300/60 font-light mb-8">{exercise.name}</h2>

        {/* 呼吸光环 */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-8">
          <div
            className="absolute inset-0 rounded-full border border-violet-400/10 transition-all duration-[2000ms] ease-in-out"
            style={{ transform: `scale(${breathScale * 1.2})`, opacity: breathScale * 0.4 }}
          />
          <div
            className="absolute inset-6 rounded-full border border-violet-400/10 transition-all duration-[2000ms] ease-in-out"
            style={{ transform: `scale(${breathScale * 1.1})`, opacity: breathScale * 0.6 }}
          />
          <div
            className="rounded-full bg-gradient-to-br from-violet-400/15 to-indigo-500/10 backdrop-blur-sm border border-violet-400/15 flex items-center justify-center transition-all duration-[2000ms] ease-in-out"
            style={{
              width: `${breathScale * 120}px`,
              height: `${breathScale * 120}px`
            }}
          >
            {!isComplete ? (
              <div className="text-center px-2">
                <p className="text-xs text-violet-300/60 tabular-nums">
                  {currentStepIndex + 1} / {totalSteps}
                </p>
              </div>
            ) : (
              <p className="text-2xl">✨</p>
            )}
          </div>
        </div>

        {/* 引导文字 */}
        <div className="min-h-[80px] flex items-center justify-center mb-6">
          {!isComplete ? (
            <p
              key={currentStepIndex}
              className="text-lg text-white/70 font-extralight leading-relaxed animate-fade-in"
            >
              {currentStep.text}
            </p>
          ) : (
            <div className="space-y-2 animate-fade-in">
              <p className="text-lg text-white/70 font-extralight">正念练习完成</p>
              <p className="text-sm text-white/30">带着这份平静继续休息吧</p>
            </div>
          )}
        </div>

        {/* 进度条 */}
        <div className="w-full max-w-xs mb-8">
          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500/40 to-indigo-400/40 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${isComplete ? 100 : overallProgress}%` }}
            />
          </div>
        </div>

        {/* 完成后可选择换一个练习 */}
        {isComplete && remaining > 30 && (
          <button
            onClick={handleNextExercise}
            className="mb-6 px-4 py-1.5 text-xs text-violet-300/40 hover:text-violet-300/70 border border-violet-400/10 hover:border-violet-400/25 rounded-full transition-all"
          >
            再来一个练习
          </button>
        )}

        {/* 喝水 */}
        {waterOverlay}

        {/* 健康卡片 */}
        {healthTip && (
          <div className="mt-4 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl max-w-sm">
            <p className="text-xs text-white/25 mb-1.5">
              {getCategoryIcon(healthTip.category)} {healthTip.title}
            </p>
            <p className="text-xs text-white/40 leading-relaxed">{healthTip.content}</p>
            {healthTip.source && (
              <p className="text-[10px] text-white/15 mt-1.5">📎 {healthTip.source}</p>
            )}
          </div>
        )}

        {/* 底部倒计时 + 跳过 */}
        <div className="flex items-center gap-6 mt-6">
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
        </div>
      </div>
    </div>
  )
}
