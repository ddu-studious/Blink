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

/** 获取图片路径 (兼容开发模式和打包模式) */
function getImagePath(filename: string): string {
  // electron-vite 开发模式: 资源在项目根目录 resources/ 下
  // 打包后: 资源在 app.asar.unpacked/resources/ 下
  // 使用相对路径，由 electron-vite 处理
  return new URL(
    `../../../../../../resources/images/nature/${filename}`,
    import.meta.url
  ).href
}

export default function NatureMode({ remaining, formatTime, showSkip, onSkip }: NatureModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const [transitioning, setTransitioning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 图片预加载
  useEffect(() => {
    SCENES.forEach((scene) => {
      const img = new Image()
      img.src = getImagePath(scene.file)
    })
  }, [])

  // 自动轮播 (每 10 秒切换)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTransitioning(true)

      // 过渡完成后切换
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % SCENES.length
          setNextIndex((next + 1) % SCENES.length)
          return next
        })
        setTransitioning(false)
      }, 1200) // 过渡时间 1.2 秒
    }, 10000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const currentScene = SCENES[currentIndex]
  const nextScene = SCENES[nextIndex]

  return (
    <div className="fixed inset-0 bg-black">
      {/* 当前图片 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-in-out"
        style={{
          backgroundImage: `url("${getImagePath(currentScene.file)}")`,
          opacity: transitioning ? 0 : 1
        }}
      />

      {/* 下一张图片 (交叉淡入) */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-in-out"
        style={{
          backgroundImage: `url("${getImagePath(nextScene.file)}")`,
          opacity: transitioning ? 1 : 0
        }}
      />

      {/* 微弱暗色叠加层 - 确保文字可读 */}
      <div className="absolute inset-0 bg-black/20" />

      {/* 轻微缩放动画 (Ken Burns 效果) */}
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1); }
          100% { transform: scale(1.06); }
        }
      `}</style>

      {/* 底部毛玻璃信息栏 */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10">
        <div className="flex items-end justify-between max-w-3xl mx-auto">
          <div className="space-y-2">
            <p className="text-xs text-white/40 tracking-wider uppercase">Natural Scenery</p>
            <p className="text-lg text-white/90 font-light">让眼睛沉浸在自然中</p>
            <p className="text-xs text-white/30">
              {currentScene.name}
              <span className="ml-2 text-white/15">Photo by {currentScene.credit}</span>
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
                    i === currentIndex ? 'bg-white/80 w-4' : 'bg-white/25'
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
