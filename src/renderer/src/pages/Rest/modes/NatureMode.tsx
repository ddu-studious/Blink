// ========================================
// 自然风光轮播模式 - 真实高清自然风景照片
// 图片来源: Unsplash (Free License)
// ========================================

import { useState, useEffect, useRef } from 'react'

interface NatureModeProps {
  remaining: number
  formatTime: (s: number) => string
  showSkip: boolean
  onSkip: () => void
}

// 自然场景配置 - 使用 resources/images/nature/ 下的真实图片
const SCENES = [
  { name: '森林', file: 'forest.jpg', credit: 'Sebastian Unrau' },
  { name: '海洋', file: 'ocean.jpg', credit: 'Sean O.' },
  { name: '山川', file: 'mountain.jpg', credit: 'Kalen Emsley' },
  { name: '湖泊', file: 'lake.jpg', credit: 'Luca Bravo' },
  { name: '草原', file: 'meadow.jpg', credit: 'Osman Rana' },
  { name: '星空', file: 'starry.jpg', credit: 'Benjamin Voros' }
]

const TRANSITION_MS = 1200

/** 获取图片路径 (兼容开发模式和打包模式) */
function getImagePath(filename: string): string {
  return new URL(
    `../../../../../../resources/images/nature/${filename}`,
    import.meta.url
  ).href
}

export default function NatureMode({ remaining, formatTime, showSkip, onSkip }: NatureModeProps) {
  const [bottomIndex, setBottomIndex] = useState(0)
  const [topIndex, setTopIndex] = useState(1)
  const [showTop, setShowTop] = useState(false)
  const [animate, setAnimate] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [totalDuration, setTotalDuration] = useState<number | null>(null)

  // 记录初始剩余时间（仅一次）
  useEffect(() => {
    if (totalDuration === null && remaining > 0) {
      setTotalDuration(remaining)
    }
  }, [remaining, totalDuration])

  // 图片预加载
  useEffect(() => {
    SCENES.forEach((scene) => {
      const img = new Image()
      img.src = getImagePath(scene.file)
    })
  }, [])

  // 根据总时长和图片数量计算轮播间隔
  useEffect(() => {
    if (!totalDuration || totalDuration <= 0) return

    const count = SCENES.length
    const intervalMs = Math.max(
      (totalDuration * 1000) / count,
      TRANSITION_MS + 2000
    )

    timerRef.current = setInterval(() => {
      // 1) 启用 CSS transition 并显示顶层
      setAnimate(true)
      setShowTop(true)
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [totalDuration])

  // 顶层淡入完成后: 将底层更新为顶层图片，然后隐藏顶层准备下一轮
  useEffect(() => {
    if (!showTop) return

    const timer = setTimeout(() => {
      // 2) 关闭 CSS transition，立即将底层切为当前图片
      setAnimate(false)
      setBottomIndex(topIndex)

      // 3) 在下一帧隐藏顶层并准备下一张图片
      requestAnimationFrame(() => {
        setShowTop(false)
        setTopIndex((prev) => (prev + 1) % SCENES.length)
      })
    }, TRANSITION_MS)

    return () => clearTimeout(timer)
  }, [showTop, topIndex])

  const bottomScene = SCENES[bottomIndex]
  const topScene = SCENES[topIndex]
  const displayIndex = showTop ? topIndex : bottomIndex

  return (
    <div className="fixed inset-0 bg-black">
      {/* 底层 - 始终可见，无动画 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("${getImagePath(bottomScene.file)}")`,
          opacity: 1
        }}
      />

      {/* 顶层 - 仅在切换时淡入，transition 仅在 animate 阶段启用 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url("${getImagePath(topScene.file)}")`,
          opacity: showTop ? 1 : 0,
          transition: animate ? `opacity ${TRANSITION_MS}ms ease-in-out` : 'none'
        }}
      />

      {/* 微弱暗色叠加层 - 确保文字可读 */}
      <div className="absolute inset-0 bg-black/20" />

      {/* 底部毛玻璃信息栏 */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10">
        <div className="flex items-end justify-between max-w-3xl mx-auto">
          <div className="space-y-2">
            <p className="text-xs text-white/40 tracking-wider uppercase">Natural Scenery</p>
            <p className="text-lg text-white/90 font-light">让眼睛沉浸在自然中</p>
            <p className="text-xs text-white/30">
              {SCENES[displayIndex].name}
              <span className="ml-2 text-white/15">Photo by {SCENES[displayIndex].credit}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-3xl font-extralight text-white tabular-nums">
                {formatTime(remaining)}
              </span>
            </div>
            {/* 场景指示器 */}
            <div className="flex gap-1.5">
              {SCENES.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                    i === displayIndex ? 'bg-white/80 w-4' : 'bg-white/25'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 跳过按钮 */}
      {showSkip && (
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={onSkip}
            className="px-4 py-1.5 text-xs text-white/30 hover:text-white/60 bg-black/20 backdrop-blur-sm border border-white/10 hover:border-white/25 rounded-full transition-all"
          >
            跳过
          </button>
        </div>
      )}
    </div>
  )
}
