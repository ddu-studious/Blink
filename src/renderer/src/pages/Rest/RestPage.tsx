import { useState, useEffect, useCallback, useMemo } from 'react'
import NatureMode from './modes/NatureMode'
import BreathingMode from './modes/BreathingMode'
import EyeTrainingMode from './modes/EyeTrainingMode'
import DarkScreenMode from './modes/DarkScreenMode'

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

// B 站运动视频推荐列表
const EXERCISE_VIDEOS = [
  {
    bvid: 'BV14Y4y1N7PW',
    title: '眼保健操',
    category: 'eye',
    description: '标准眼保健操，放松眼部肌肉'
  },
  {
    bvid: 'BV1o44y1j7NX',
    title: '眼肌训练操',
    category: 'eye',
    description: '0 成本眼肌训练，改善视力'
  },
  {
    bvid: 'BV1wy4y1p73y',
    title: '久坐拉伸',
    category: 'stretch',
    description: '帕梅拉 8 分钟久坐拉伸'
  },
  {
    bvid: 'BV1MT4y1772p',
    title: '天鹅颈直角肩',
    category: 'stretch',
    description: '帕梅拉肩颈放松运动'
  },
  {
    bvid: 'BV1va411s7YD',
    title: '每日拉伸',
    category: 'stretch',
    description: '帕梅拉 8 分钟全身拉伸'
  }
]

type RestScreenMode = 'classic' | 'nature' | 'breathing' | 'eyeTraining' | 'darkScreen'

interface RestPageProps {
  breakType: 'mini' | 'long'
  duration: number
  isPrimary: boolean
}

interface AppSettings {
  reminder: {
    skipButtonDelay: number
    soundEnabled: boolean
    restScreen: {
      miniBreakMode: RestScreenMode
      longBreakMode: RestScreenMode
      ambientSoundEnabled: boolean
      ambientSoundType: string
    }
  }
  smart: {
    strictMode: boolean
  }
}

export default function RestPage({ breakType, duration, isPrimary }: RestPageProps) {
  const [remaining, setRemaining] = useState(duration)
  const [showSkip, setShowSkip] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [showVideo, setShowVideo] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<(typeof EXERCISE_VIDEOS)[0] | null>(null)

  const [tip] = useState(() => {
    const tips = breakType === 'mini' ? EYE_TIPS : STRETCH_TIPS
    return tips[Math.floor(Math.random() * tips.length)]
  })

  // 加载设置
  useEffect(() => {
    window.api.settings.get().then((s: AppSettings) => setSettings(s))
  }, [])

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

  // 延迟显示跳过按钮 (使用 skipButtonDelay 配置)
  useEffect(() => {
    if (!settings) return

    // 严格模式下不显示跳过按钮
    if (settings.smart.strictMode) return

    const delay = (settings.reminder.skipButtonDelay ?? 5) * 1000
    const timer = setTimeout(() => setShowSkip(true), delay)
    return () => clearTimeout(timer)
  }, [settings])

  // 监听来自主进程的状态更新
  useEffect(() => {
    const cleanup = window.api.timer.onStateUpdate(
      (state: { status: string; breakRemaining?: number }) => {
        // 同步主进程的倒计时 (严格模式重置时会改变)
        if (state.status === 'break' && state.breakRemaining !== undefined) {
          setRemaining(state.breakRemaining)
        }
      }
    )
    return cleanup
  }, [])

  // 严格模式: 检测鼠标/键盘活动并通知主进程重置倒计时
  useEffect(() => {
    if (!settings?.smart.strictMode || !isPrimary) return

    let activityTimeout: ReturnType<typeof setTimeout> | null = null

    const handleActivity = () => {
      if (activityTimeout) return
      activityTimeout = setTimeout(() => {
        activityTimeout = null
      }, 2000)
      window.api.break.activityDetected()
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('mousedown', handleActivity)
    window.addEventListener('keydown', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      if (activityTimeout) clearTimeout(activityTimeout)
    }
  }, [settings, isPrimary])

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
  const isLong = breakType === 'long'

  // 当前使用的休息模式
  const currentMode: RestScreenMode = useMemo(() => {
    if (!settings?.reminder?.restScreen) return 'classic'
    return isMini
      ? settings.reminder.restScreen.miniBreakMode
      : settings.reminder.restScreen.longBreakMode
  }, [settings, isMini])

  // 当前类别的视频列表
  const videoList = useMemo(() => {
    if (isMini) return EXERCISE_VIDEOS.filter((v) => v.category === 'eye')
    return EXERCISE_VIDEOS
  }, [isMini])

  // 打开视频
  const handlePlayVideo = (video: (typeof EXERCISE_VIDEOS)[0]) => {
    setCurrentVideo(video)
    setShowVideo(true)
  }

  // 非主屏幕: 简单提示
  if (!isPrimary) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md">
        <p className="text-2xl text-white/40 font-extralight">🌿 休息一下</p>
      </div>
    )
  }

  // 非经典模式: 渲染对应组件
  if (currentMode !== 'classic' && !showVideo) {
    switch (currentMode) {
      case 'nature':
        return (
          <NatureMode
            remaining={remaining}
            formatTime={formatTime}
            showSkip={showSkip}
            onSkip={handleSkip}
          />
        )
      case 'breathing':
        return (
          <BreathingMode
            remaining={remaining}
            formatTime={formatTime}
            showSkip={showSkip}
            onSkip={handleSkip}
          />
        )
      case 'eyeTraining':
        return (
          <EyeTrainingMode
            remaining={remaining}
            formatTime={formatTime}
            showSkip={showSkip}
            onSkip={handleSkip}
          />
        )
      case 'darkScreen':
        return (
          <DarkScreenMode
            remaining={remaining}
            formatTime={formatTime}
            showSkip={showSkip}
            onSkip={handleSkip}
          />
        )
    }
  }

  // 经典模式 (原有逻辑)
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

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full px-8">
        {/* 视频播放模式 */}
        {showVideo && currentVideo ? (
          <div className="w-full flex flex-col items-center space-y-4">
            <div className="flex items-center justify-between w-full max-w-2xl">
              <h2 className="text-lg text-white/60 font-light">🎬 {currentVideo.title}</h2>
              <button
                onClick={() => {
                  setShowVideo(false)
                  setCurrentVideo(null)
                }}
                className="text-sm text-white/40 hover:text-white/80 px-3 py-1 border border-white/10 hover:border-white/30 rounded-full transition-all"
              >
                返回
              </button>
            </div>
            <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-black/50 shadow-2xl">
              <iframe
                src={`https://player.bilibili.com/player.html?bvid=${currentVideo.bvid}&autoplay=1&danmaku=0&high_quality=1`}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
            <div className="flex items-center space-x-6 mt-2">
              <span className="text-2xl font-extralight text-white/60 tabular-nums">
                {formatTime(remaining)}
              </span>
              {showSkip && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-1.5 text-sm text-white/40 hover:text-white/80 border border-white/10 hover:border-white/30 rounded-full transition-all duration-300"
                >
                  跳过
                </button>
              )}
            </div>
          </div>
        ) : (
          /* 默认经典休息界面 */
          <div className="flex flex-col items-center space-y-8">
            <h2 className="text-xl text-white/60 font-light tracking-wider">
              {isMini ? '短休息' : '长休息'}
            </h2>

            {/* 倒计时进度环 */}
            <div className="relative">
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

            {/* 运动视频推荐区域 */}
            {isLong && (
              <div className="w-full max-w-lg">
                <p className="text-xs text-white/30 mb-3">🏃 跟着视频一起运动</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {videoList.map((video) => (
                    <button
                      key={video.bvid}
                      onClick={() => handlePlayVideo(video)}
                      className="px-3 py-1.5 text-xs text-white/50 hover:text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-lg transition-all duration-300"
                    >
                      {video.category === 'eye' ? '👁️' : '💪'} {video.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 短休息时的眼部运动入口 */}
            {isMini && (
              <div className="flex gap-2">
                {videoList.slice(0, 2).map((video) => (
                  <button
                    key={video.bvid}
                    onClick={() => handlePlayVideo(video)}
                    className="px-3 py-1.5 text-xs text-white/30 hover:text-white/70 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg transition-all duration-300"
                  >
                    👁️ {video.title}
                  </button>
                ))}
              </div>
            )}

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
        )}
      </div>
    </div>
  )
}
