import { useState, useEffect, useCallback } from 'react'

// 护眼小知识库
const EYE_TIPS = [
  '每 20 分钟看向 20 英尺（6 米）外远眺 20 秒',
  '有意识地多眨眼，保持眼睛湿润',
  '调整屏幕亮度，使其与周围环境光线一致',
  '屏幕距离眼睛应保持 50-70 厘米',
  '使用防蓝光眼镜可以减轻眼部疲劳',
  '定期做眼保健操，缓解眼部肌肉紧张',
  '保持室内适当湿度，避免眼睛干涩',
  '多吃富含维生素 A 的食物，如胡萝卜和蓝莓'
]

// 长休息活动建议
const STRETCH_TIPS = [
  '站起来做 10 次颈部旋转运动',
  '伸展双臂，做 5 次扩胸运动',
  '走到窗边，欣赏远处的风景',
  '闭上眼睛，深呼吸 5 次',
  '用掌心搓热后轻轻敷在眼睛上',
  '做几次肩部环绕运动，放松肩颈',
  '倒一杯水，补充水分',
  '到阳台或户外走走，呼吸新鲜空气'
]

interface RestPageProps {
  breakType: 'mini' | 'long'
  duration: number
  isPrimary: boolean
}

export default function RestPage({ breakType, duration, isPrimary }: RestPageProps) {
  const [remaining, setRemaining] = useState(duration)
  const [showSkip, setShowSkip] = useState(false)
  const [tip] = useState(() => {
    const tips = breakType === 'mini' ? EYE_TIPS : STRETCH_TIPS
    return tips[Math.floor(Math.random() * tips.length)]
  })

  // 倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 延迟显示跳过按钮 (5秒后)
  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  // 监听来自主进程的状态更新
  useEffect(() => {
    const cleanup = window.api.timer.onStateUpdate((state) => {
      // 如果休息结束 (状态不再是 break)，窗口会由主进程关闭
      if (state.status !== 'break') {
        // 窗口即将被主进程关闭
      }
    })
    return cleanup
  }, [])

  // 跳过休息
  const handleSkip = useCallback(() => {
    window.api.break.skip()
  }, [])

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `:${secs.toString().padStart(2, '0')}`
  }

  // 进度百分比
  const progress = ((duration - remaining) / duration) * 100

  const isMini = breakType === 'mini'

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      {/* 背景渐变装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-3xl opacity-20 ${
            isMini ? 'bg-primary-500' : 'bg-eye-500'
          }`}
        />
        <div
          className={`absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-3xl opacity-20 ${
            isMini ? 'bg-primary-400' : 'bg-eye-400'
          }`}
        />
      </div>

      {/* 主要内容区域 - 只在主屏幕显示交互内容 */}
      {isPrimary ? (
        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-lg px-8">
          {/* 标题 */}
          <h2 className="text-xl text-white/60 font-light tracking-wider">
            {isMini ? '短休息' : '长休息'}
          </h2>

          {/* 倒计时数字 */}
          <div className="relative">
            {/* 进度环 */}
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="3"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={isMini ? '#0ea5e9' : '#22c55e'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            {/* 时间文字 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-extralight text-white tracking-wider tabular-nums">
                {formatTime(remaining)}
              </span>
            </div>
          </div>

          {/* 提示文字 */}
          <div className="space-y-3">
            <p className="text-lg text-white/80 font-light">
              {isMini ? '望向远方，让眼睛放松一下' : '站起来活动一下身体吧'}
            </p>
            <p className="text-sm text-white/40 max-w-sm leading-relaxed">💡 {tip}</p>
          </div>

          {/* 跳过按钮 */}
          {showSkip && (
            <button
              onClick={handleSkip}
              className="mt-4 px-6 py-2 text-sm text-white/40 hover:text-white/80 border border-white/10 hover:border-white/30 rounded-full transition-all duration-300 animate-fade-in"
            >
              跳过
            </button>
          )}
        </div>
      ) : (
        /* 非主屏幕：仅显示简单提示 */
        <div className="relative z-10 text-center">
          <p className="text-2xl text-white/40 font-extralight">🌿 休息一下</p>
        </div>
      )}
    </div>
  )
}
