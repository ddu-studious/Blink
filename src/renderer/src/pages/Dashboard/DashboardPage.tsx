import { useState, useEffect } from 'react'

interface TodayStats {
  date: string
  miniBreaksCompleted: number
  miniBreaksSkipped: number
  longBreaksCompleted: number
  longBreaksSkipped: number
  totalRestSeconds: number
}

interface TimerState {
  status: string
  miniBreakRemaining: number
  longBreakRemaining: number
  todayMiniBreaks: number
  todayLongBreaks: number
  todaySkipped: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<TodayStats | null>(null)
  const [timerState, setTimerState] = useState<TimerState | null>(null)

  useEffect(() => {
    // 加载今日统计
    window.api.stats.getToday().then(setStats)

    // 获取计时器状态
    window.api.timer.getState().then(setTimerState)

    // 监听状态更新
    const cleanup = window.api.timer.onStateUpdate((state) => {
      setTimerState(state as TimerState)
    })

    return cleanup
  }, [])

  const formatMinutes = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'running': return '护眼中'
      case 'paused': return '已暂停'
      case 'break': return '休息中'
      case 'idle': return '未启动'
      default: return status
    }
  }

  const statusColor = (status: string): string => {
    switch (status) {
      case 'running': return 'text-eye-500'
      case 'paused': return 'text-yellow-500'
      case 'break': return 'text-primary-500'
      case 'idle': return 'text-gray-400'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">📊 今日统计</h1>

      {/* 当前状态 */}
      {timerState && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">当前状态</p>
              <p className={`text-2xl font-semibold ${statusColor(timerState.status)}`}>
                {statusLabel(timerState.status)}
              </p>
            </div>
            {timerState.status === 'running' && (
              <div className="text-right">
                <p className="text-xs text-gray-400">距下次休息</p>
                <p className="text-3xl font-light text-primary-600 dark:text-primary-400 tabular-nums">
                  {formatMinutes(timerState.miniBreakRemaining)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          label="短休息完成"
          value={stats?.miniBreaksCompleted || 0}
          suffix="次"
          color="text-primary-500"
        />
        <StatCard
          label="长休息完成"
          value={stats?.longBreaksCompleted || 0}
          suffix="次"
          color="text-eye-500"
        />
        <StatCard
          label="总休息时长"
          value={Math.floor((stats?.totalRestSeconds || 0) / 60)}
          suffix="分钟"
          color="text-indigo-500"
        />
        <StatCard
          label="跳过次数"
          value={(stats?.miniBreaksSkipped || 0) + (stats?.longBreaksSkipped || 0)}
          suffix="次"
          color="text-orange-500"
        />
      </div>

      {/* 达成率 */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            今日达成率
          </h3>
          <CompletionBar stats={stats} />
        </div>
      )}

      {/* 操作按钮 */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => {
            if (timerState?.status === 'idle') {
              window.api.timer.start()
            } else if (timerState?.status === 'paused') {
              window.api.timer.resume()
            } else if (timerState?.status === 'running') {
              window.api.timer.pause()
            }
          }}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors"
        >
          {timerState?.status === 'running'
            ? '暂停护眼'
            : timerState?.status === 'paused'
              ? '恢复护眼'
              : '开始护眼'}
        </button>
        <button
          onClick={() => window.api.timer.takeBreak('mini')}
          disabled={timerState?.status !== 'running'}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
        >
          立即休息
        </button>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
  color
}: {
  label: string
  value: number
  suffix: string
  color: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color} tabular-nums`}>
        {value}
        <span className="text-sm font-normal text-gray-400 ml-1">{suffix}</span>
      </p>
    </div>
  )
}

function CompletionBar({ stats }: { stats: TodayStats }) {
  const total =
    stats.miniBreaksCompleted +
    stats.miniBreaksSkipped +
    stats.longBreaksCompleted +
    stats.longBreaksSkipped
  const completed = stats.miniBreaksCompleted + stats.longBreaksCompleted
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">
          {completed}/{total} 次
        </span>
        <span className="text-sm font-semibold text-eye-500">{rate}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-eye-500 rounded-full transition-all duration-500"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  )
}
