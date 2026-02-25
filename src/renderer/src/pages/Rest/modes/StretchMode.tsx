// ========================================
// 拉伸引导模式 - 左右分栏：视频 + 步骤引导
// ========================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  getRandomStretch,
  expandSteps,
  getExpandedDuration,
  type StretchAction,
  type StretchStep,
  type StretchVideo
} from '../../../data/stretches'

interface StretchModeProps {
  remaining: number
  formatTime: (s: number) => string
  showSkip: boolean
  onSkip: () => void
  waterOverlay?: React.ReactNode
}

function getImagePath(filename: string): string {
  return new URL(
    `../../../../../../resources/images/nature/${filename}`,
    import.meta.url
  ).href
}

const BG_IMAGES = ['forest.jpg', 'meadow.jpg', 'lake.jpg']

export default function StretchMode({ remaining, formatTime, showSkip, onSkip, waterOverlay }: StretchModeProps) {
  const [currentStretch, setCurrentStretch] = useState<StretchAction>(() => getRandomStretch())
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [stepTimeLeft, setStepTimeLeft] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [bgImage] = useState(() => BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)])
  const [videoMuted, setVideoMuted] = useState(true)
  const [selectedVideoPlatform, setSelectedVideoPlatform] = useState<'bilibili' | 'youtube'>('bilibili')
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const hasRecorded = useRef(false)
  const autoSwitchTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const expandedSteps = useMemo<StretchStep[]>(() => expandSteps(currentStretch), [currentStretch])
  const expandedDuration = useMemo(() => getExpandedDuration(currentStretch), [currentStretch])

  const activeVideo = useMemo<StretchVideo | null>(() => {
    if (!currentStretch.videos || currentStretch.videos.length === 0) return null
    const match = currentStretch.videos.find(v => v.platform === selectedVideoPlatform)
    return match || currentStretch.videos[0]
  }, [currentStretch, selectedVideoPlatform])

  const hasVideo = activeVideo !== null && !videoError

  const videoSrc = useMemo(() => {
    if (!activeVideo) return ''
    const mutedParam = videoMuted ? '1' : '0'
    if (activeVideo.platform === 'bilibili') {
      return `https://player.bilibili.com/player.html?bvid=${activeVideo.id}&autoplay=1&danmaku=0&high_quality=1&muted=${mutedParam}`
    }
    return `https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0&mute=${mutedParam}`
  }, [activeVideo, videoMuted])

  const availablePlatforms = useMemo(() => {
    if (!currentStretch.videos) return []
    return [...new Set(currentStretch.videos.map(v => v.platform))]
  }, [currentStretch])

  // --- 步骤计时逻辑 ---

  useEffect(() => {
    if (activeStepIndex < expandedSteps.length) {
      setStepTimeLeft(expandedSteps[activeStepIndex].duration)
    }
  }, [activeStepIndex, expandedSteps])

  useEffect(() => {
    if (activeStepIndex >= expandedSteps.length) return

    autoSwitchTimer.current = setInterval(() => {
      setStepTimeLeft((prev) => {
        if (prev <= 1) {
          setCompletedSteps((old) => {
            const next = new Set(old)
            next.add(activeStepIndex)
            return next
          })
          setActiveStepIndex((idx) => idx + 1)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (autoSwitchTimer.current) clearInterval(autoSwitchTimer.current)
    }
  }, [activeStepIndex, expandedSteps.length])

  useEffect(() => {
    if (activeStepIndex >= expandedSteps.length && expandedSteps.length > 0) {
      if (!hasRecorded.current) {
        recordCurrentStretch()
      }
      const timer = setTimeout(() => {
        switchToNextStretch()
      }, 1500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [activeStepIndex, expandedSteps.length])

  const recordCurrentStretch = () => {
    if (hasRecorded.current) return
    hasRecorded.current = true
    window.api.exercise
      .record('stretch', currentStretch.name, expandedDuration, 'break')
      .catch(() => {})
  }

  const switchToNextStretch = useCallback(() => {
    if (completedSteps.size > 0 && !hasRecorded.current) {
      recordCurrentStretch()
    }
    setCurrentStretch(getRandomStretch())
    setActiveStepIndex(0)
    setCompletedSteps(new Set())
    hasRecorded.current = false
    setVideoLoaded(false)
    setVideoError(false)
  }, [completedSteps.size])

  const progress = expandedSteps.length > 0
    ? (completedSteps.size / expandedSteps.length) * 100
    : 0
  const allDone = activeStepIndex >= expandedSteps.length

  const stepProgress = useMemo(() => {
    if (activeStepIndex >= expandedSteps.length) return 100
    const totalDur = expandedSteps[activeStepIndex]?.duration || 1
    return ((totalDur - stepTimeLeft) / totalDur) * 100
  }, [activeStepIndex, stepTimeLeft, expandedSteps])

  const currentRoundLabel = useMemo(() => {
    if (activeStepIndex >= expandedSteps.length) return null
    const step = expandedSteps[activeStepIndex]
    const match = step.text.match(/^\[(\d+)轮\]\s/)
    if (match) return `第 ${match[1]} 轮`
    return null
  }, [activeStepIndex, expandedSteps])

  return (
    <div className="fixed inset-0">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${getImagePath(bgImage)}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-teal-900/70 to-green-900/80" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-400/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col px-8 py-6">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <div>
              <h2 className="text-lg text-white/90 font-light">长休息 · 拉伸一下</h2>
              <p className="text-xs text-white/40 mt-0.5">让身体也放松放松</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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

        {/* 主体内容：左右分栏 */}
        <div className={`flex-1 flex ${hasVideo ? 'gap-6' : 'justify-center'} min-h-0`}>
          {/* 左侧：视频区域 */}
          {hasVideo && (
            <div className="w-[55%] flex flex-col min-h-0">
              <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
                {/* 视频加载骨架屏 */}
                {!videoLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      <span className="text-sm text-white/40">视频加载中...</span>
                    </div>
                  </div>
                )}
                <iframe
                  key={`${activeVideo!.platform}-${activeVideo!.id}-${videoMuted}`}
                  src={videoSrc}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                  onLoad={() => setVideoLoaded(true)}
                  onError={() => setVideoError(true)}
                />
              </div>

              {/* 视频控制栏 */}
              <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVideoMuted(!videoMuted)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                  >
                    {videoMuted ? '🔇 点击开启声音' : '🔊 点击静音'}
                  </button>
                  {availablePlatforms.length > 1 && (
                    <div className="flex items-center gap-1 ml-2">
                      {availablePlatforms.map(p => (
                        <button
                          key={p}
                          onClick={() => {
                            setSelectedVideoPlatform(p)
                            setVideoLoaded(false)
                          }}
                          className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                            selectedVideoPlatform === p
                              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                              : 'text-white/40 hover:text-white/70 bg-white/5 border border-white/10'
                          }`}
                        >
                          {p === 'bilibili' ? '🅱️ B站' : '▶️ YouTube'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-white/25">
                  {activeVideo!.title}
                </span>
              </div>
            </div>
          )}

          {/* 右侧：步骤引导 */}
          <div className={`${hasVideo ? 'w-[45%]' : 'w-full max-w-2xl'} flex flex-col min-h-0`}>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 p-6 shadow-2xl flex flex-col min-h-0 flex-1">
              {/* 动作标题 */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{currentStretch.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span>🎯 {currentStretch.targetArea}</span>
                    <span>·</span>
                    <span>⏱ {expandedDuration}秒</span>
                    {currentRoundLabel && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-300/80">🔄 {currentRoundLabel}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={switchToNextStretch}
                  className="px-3 py-1.5 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
                >
                  下一个
                </button>
              </div>

              {/* 步骤列表 - 可滚动 */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 min-h-0">
                {expandedSteps.map((step, index) => {
                  const isCompleted = completedSteps.has(index)
                  const isActive = index === activeStepIndex && !allDone
                  const totalDur = step.duration || 1
                  const displayText = step.text.replace(/^\[\d+轮\]\s/, '')
                  const roundTag = step.text.match(/^\[(\d+)轮\]/)

                  return (
                    <div
                      key={index}
                      className={`relative flex items-center gap-2.5 p-3 rounded-xl transition-all overflow-hidden ${
                        isCompleted
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : isActive
                            ? 'bg-white/10 border border-emerald-400/40'
                            : 'bg-white/5 border border-white/10 opacity-60'
                      }`}
                    >
                      {isActive && (
                        <div
                          className="absolute inset-0 bg-emerald-500/10 transition-all duration-1000 ease-linear"
                          style={{ width: `${stepProgress}%` }}
                        />
                      )}
                      <div className="relative flex items-center gap-2.5 flex-1">
                        <div className="flex-shrink-0 relative w-7 h-7">
                          {isCompleted ? (
                            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          ) : isActive ? (
                            <StepCountdownRing timeLeft={stepTimeLeft} totalTime={totalDur} index={index} />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex items-center gap-1.5">
                          {roundTag && (
                            <span className="flex-shrink-0 px-1 py-0.5 text-[9px] text-emerald-300/80 bg-emerald-500/15 rounded">
                              {roundTag[1]}轮
                            </span>
                          )}
                          <p className={`flex-1 text-xs leading-relaxed ${
                            isCompleted ? 'text-emerald-300/70 line-through' : isActive ? 'text-white' : 'text-white/50'
                          }`}>
                            {displayText}
                          </p>
                        </div>
                        {isActive && (
                          <span className="text-[11px] text-emerald-300 tabular-nums font-mono">
                            {stepTimeLeft}s
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {allDone && (
                <div className="text-center py-2 mb-3 flex-shrink-0">
                  <p className="text-emerald-300 text-xs">✨ 动作完成！即将切换下一个...</p>
                </div>
              )}

              {/* 进度 */}
              <div className="mb-3 flex-shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-white/50">完成进度</span>
                  <span className="text-xs font-medium text-white/70">
                    {completedSteps.size} / {expandedSteps.length}
                  </span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 提示 */}
              {currentStretch.tips && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-3 flex-shrink-0">
                  <p className="text-[11px] text-emerald-200/80">💡 {currentStretch.tips}</p>
                </div>
              )}

              {/* 无视频时底部显示视频按钮 */}
              {!hasVideo && currentStretch.videos && currentStretch.videos.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  <span className="text-[10px] text-white/30">📹 跟练视频:</span>
                  {currentStretch.videos.map((video) => (
                    <button
                      key={`${video.platform}-${video.id}`}
                      onClick={() => {
                        setSelectedVideoPlatform(video.platform)
                        setVideoError(false)
                        setVideoLoaded(false)
                      }}
                      className="px-2 py-1 text-[10px] text-white/50 hover:text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-lg transition-all"
                    >
                      {video.platform === 'bilibili' ? '🅱️' : '▶️'} {video.title}
                    </button>
                  ))}
                </div>
              )}

              {waterOverlay && <div className="mt-3 flex-shrink-0">{waterOverlay}</div>}
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-3 flex-shrink-0">
          <p className="text-[10px] text-white/25">
            长休息时进行拉伸，可以有效缓解久坐带来的身体疲劳
          </p>
        </div>
      </div>
    </div>
  )
}

/** 步骤倒计时圆环 */
function StepCountdownRing({ timeLeft, totalTime, index }: { timeLeft: number; totalTime: number; index: number }) {
  const radius = 11
  const circumference = 2 * Math.PI * radius
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) : 0
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="relative w-7 h-7">
      <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <circle
          cx="14" cy="14" r={radius} fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] text-emerald-300 font-medium">
        {index + 1}
      </span>
    </div>
  )
}
