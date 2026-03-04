// ========================================
// 纯黑/暗屏模式 - 最小光照
// ========================================

interface DarkScreenModeProps {
  remaining: number
  formatTime: (s: number) => string
  showSkip: boolean
  onSkip: () => void
  onOpenSettings?: () => void
}

export default function DarkScreenMode({
  remaining,
  formatTime,
  showSkip,
  onSkip,
  onOpenSettings
}: DarkScreenModeProps) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center text-center space-y-12 animate-fade-in">
        {/* 极微弱标题 */}
        <p className="text-xs text-white/[0.08] tracking-[0.3em] uppercase">Dark Mode</p>

        {/* 极微弱倒计时 */}
        <span className="text-6xl font-extralight text-white/[0.12] tabular-nums">
          {formatTime(remaining)}
        </span>

        {/* 极微弱提示 */}
        <p className="text-xs text-white/[0.06]">闭上眼睛，让眼睛完全放松</p>

        {/* 极微弱跳过 */}
        {showSkip && (
          <button
            onClick={onSkip}
            className="px-5 py-1.5 text-[11px] text-white/[0.06] hover:text-white/20 border border-white/[0.03] hover:border-white/10 rounded-full transition-all duration-500"
          >
            跳过
          </button>
        )}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 text-[11px] text-white/[0.04] hover:text-white/15 border border-white/[0.02] hover:border-white/[0.08] rounded-full transition-all duration-500"
            title="设置"
          >
            ⚙️
          </button>
        )}
      </div>
    </div>
  )
}
