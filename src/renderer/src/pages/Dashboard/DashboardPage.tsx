import { useState, useEffect, useMemo, useCallback } from 'react'

interface WaterDailyStats {
  totalMl: number
  recordCount: number
}

interface WaterSettings {
  enabled: boolean
  dailyGoal: number
  quickAmounts: number[]
}

interface ExerciseDailyStats {
  date: string
  standCount: number
  stretchCount: number
  mindfulCount: number
  totalDuration: number
}

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

type TabView = 'today' | 'week'

export default function DashboardPage() {
  const [stats, setStats] = useState<TodayStats | null>(null)
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [weekStats, setWeekStats] = useState<TodayStats[]>([])
  const [streak, setStreak] = useState(0)
  const [activeTab, setActiveTab] = useState<TabView>('today')
  const [waterStats, setWaterStats] = useState<WaterDailyStats | null>(null)
  const [waterStreak, setWaterStreak] = useState(0)
  const [waterSettings, setWaterSettings] = useState<WaterSettings | null>(null)
  const [exerciseStats, setExerciseStats] = useState<ExerciseDailyStats | null>(null)
  const [exerciseStreak, setExerciseStreak] = useState(0)

  const refreshWater = useCallback(() => {
    window.api.water.getToday().then(setWaterStats)
    window.api.water.getStreak().then(setWaterStreak)
  }, [])

  useEffect(() => {
    // 加载今日统计
    window.api.stats.getToday().then(setStats)

    // 获取计时器状态
    window.api.timer.getState().then((state) => {
      setTimerState(state as TimerState)
      // 如果状态是 idle，自动启动计时器
      if (state.status === 'idle') {
        window.api.timer.start()
      }
    })

    // 获取连续天数
    window.api.stats.getStreak().then(setStreak)

    // 获取最近 7 天数据
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)
    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    window.api.stats.getRange(formatDate(weekAgo), formatDate(today)).then(setWeekStats)

    // 加载喝水数据
    window.api.settings.get().then((s: { water: WaterSettings }) => setWaterSettings(s.water))
    refreshWater()

    // 加载运动数据
    window.api.exercise.getToday().then(setExerciseStats)
    window.api.exercise.getStreak().then(setExerciseStreak)

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
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">📊 统计</h1>
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              activeTab === 'today'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm font-medium'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            今日
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              activeTab === 'week'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm font-medium'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            本周
          </button>
        </div>
      </div>

      {activeTab === 'today' ? (
        <TodayView
          stats={stats}
          timerState={timerState}
          streak={streak}
          formatMinutes={formatMinutes}
          statusLabel={statusLabel}
          statusColor={statusColor}
          waterStats={waterStats}
          waterStreak={waterStreak}
          waterSettings={waterSettings}
          exerciseStats={exerciseStats}
          exerciseStreak={exerciseStreak}
          onRecordWater={(amount) => {
            window.api.water.record(amount, 'manual').then(() => refreshWater())
          }}
        />
      ) : (
        <WeekView weekStats={weekStats} streak={streak} />
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

      {/* 快速体验 */}
      <div className="mt-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">🧘 快速体验</p>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => window.api.timer.takeBreakWithMode('long', 'stretch')}
            className="py-2 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-100 dark:border-purple-800/30 transition-colors"
          >
            💪 拉伸
          </button>
          <button
            onClick={() => window.api.timer.takeBreakWithMode('long', 'mindful')}
            className="py-2 rounded-lg text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-100 dark:border-violet-800/30 transition-colors"
          >
            🕊️ 正念
          </button>
          <button
            onClick={() => window.api.timer.takeBreakWithMode('mini', 'breathing')}
            className="py-2 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-700/30 transition-colors"
          >
            🫁 呼吸
          </button>
          <button
            onClick={() => window.api.timer.takeBreakWithMode('mini', 'eyeTraining')}
            className="py-2 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800/30 transition-colors"
          >
            👁️ 护眼
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- 今日视图 ----
function TodayView({
  stats,
  timerState,
  streak,
  formatMinutes,
  statusLabel,
  statusColor,
  waterStats,
  waterStreak,
  waterSettings,
  exerciseStats,
  exerciseStreak,
  onRecordWater
}: {
  stats: TodayStats | null
  timerState: TimerState | null
  streak: number
  formatMinutes: (s: number) => string
  statusLabel: (s: string) => string
  statusColor: (s: string) => string
  waterStats: WaterDailyStats | null
  waterStreak: number
  waterSettings: WaterSettings | null
  exerciseStats: ExerciseDailyStats | null
  exerciseStreak: number
  onRecordWater: (amount: number) => void
}) {
  const dailyGoal = waterSettings?.dailyGoal || 2000
  const totalMl = waterStats?.totalMl || 0
  const waterProgress = Math.min(totalMl / dailyGoal, 1)
  const cups = Math.round(totalMl / 250)
  const goalCups = Math.round(dailyGoal / 250)
  const remaining = Math.max(goalCups - cups, 0)
  const isComplete = totalMl >= dailyGoal

  return (
    <>
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

      {/* 连续天数 + 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* 连续坚持 */}
        <div className="col-span-2 bg-gradient-to-r from-primary-500 to-eye-500 rounded-xl p-4 shadow-sm text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70">连续坚持</p>
              <p className="text-3xl font-bold tabular-nums mt-1">
                {streak} <span className="text-lg font-normal text-white/80">天</span>
              </p>
            </div>
            <div className="text-4xl opacity-30">🔥</div>
          </div>
        </div>

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

      {/* 今日运动卡片 */}
      {exerciseStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">🏃 今日运动</h3>
            {exerciseStreak > 0 && (
              <span className="text-xs text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                🔥 连续 {exerciseStreak} 天
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">🪑 站立</p>
              <p className="text-2xl font-semibold text-orange-500 tabular-nums">
                {exerciseStats.standCount}
                <span className="text-sm font-normal text-gray-400 ml-1">次</span>
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">💪 拉伸</p>
              <p className="text-2xl font-semibold text-purple-500 tabular-nums">
                {exerciseStats.stretchCount}
                <span className="text-sm font-normal text-gray-400 ml-1">次</span>
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">🧘 正念</p>
              <p className="text-2xl font-semibold text-violet-500 tabular-nums">
                {exerciseStats.mindfulCount}
                <span className="text-sm font-normal text-gray-400 ml-1">次</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 今日喝水卡片 */}
      {waterSettings?.enabled && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">💧 今日喝水</h3>
            {waterStreak > 0 && (
              <span className="text-xs text-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-0.5 rounded-full">
                🔥 连续 {waterStreak} 天达标
              </span>
            )}
          </div>

          <div className="flex items-center gap-5">
            {/* 圆环进度 */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="5" className="text-gray-100 dark:text-gray-700" />
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke={isComplete ? '#10b981' : '#06b6d4'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - waterProgress)}`}
                  transform="rotate(-90 40 40)"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-semibold tabular-nums ${isComplete ? 'text-emerald-500' : 'text-cyan-500'}`}>
                  {Math.round(waterProgress * 100)}%
                </span>
              </div>
            </div>

            {/* 信息 */}
            <div className="flex-1">
              <p className="text-2xl font-semibold text-gray-800 dark:text-white tabular-nums">
                {totalMl}
                <span className="text-sm font-normal text-gray-400 ml-1">/ {dailyGoal} ml</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isComplete ? '🎉 今日已达标！' : `还差 ${remaining} 杯 (${dailyGoal - totalMl}ml)`}
              </p>

              {/* 快速记录按钮 */}
              <div className="flex gap-2 mt-3">
                {(waterSettings.quickAmounts || [250, 500, 750]).map((amount) => (
                  <button
                    key={amount}
                    onClick={() => onRecordWater(amount)}
                    className="px-2.5 py-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 rounded-lg transition-colors"
                  >
                    +{amount}ml
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 达成率 */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            今日达成率
          </h3>
          <CompletionBar stats={stats} />
        </div>
      )}
    </>
  )
}

// ---- 本周视图 ----
function WeekView({ weekStats, streak }: { weekStats: TodayStats[]; streak: number }) {
  // 生成最近 7 天的日期标签
  const days = useMemo(() => {
    const result: { date: string; label: string; dayOfWeek: string }[] = []
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        dayOfWeek: dayNames[d.getDay()]
      })
    }
    return result
  }, [])

  // 将 weekStats 映射到 7 天
  const chartData = useMemo(() => {
    const statsMap = new Map(weekStats.map((s) => [s.date, s]))
    return days.map((day) => {
      const s = statsMap.get(day.date)
      return {
        ...day,
        completed: s ? s.miniBreaksCompleted + s.longBreaksCompleted : 0,
        skipped: s ? s.miniBreaksSkipped + s.longBreaksSkipped : 0,
        restMinutes: s ? Math.round(s.totalRestSeconds / 60) : 0
      }
    })
  }, [days, weekStats])

  const maxCompleted = Math.max(...chartData.map((d) => d.completed), 1)
  const totalCompleted = chartData.reduce((sum, d) => sum + d.completed, 0)
  const totalSkipped = chartData.reduce((sum, d) => sum + d.skipped, 0)
  const totalRestMinutes = chartData.reduce((sum, d) => sum + d.restMinutes, 0)

  return (
    <>
      {/* 周概览卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400">本周完成</p>
          <p className="text-2xl font-semibold text-primary-500 tabular-nums mt-1">{totalCompleted}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400">本周跳过</p>
          <p className="text-2xl font-semibold text-orange-500 tabular-nums mt-1">{totalSkipped}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400">总休息</p>
          <p className="text-2xl font-semibold text-eye-500 tabular-nums mt-1">{totalRestMinutes}<span className="text-sm font-normal text-gray-400 ml-0.5">分</span></p>
        </div>
      </div>

      {/* SVG 柱状图 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">每日休息完成次数</h3>
        <div className="flex items-end justify-between gap-2" style={{ height: '140px' }}>
          {chartData.map((day, i) => {
            const isToday = i === chartData.length - 1
            const barHeight = maxCompleted > 0 ? (day.completed / maxCompleted) * 100 : 0
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                {/* 数值 */}
                <span className={`text-xs tabular-nums ${day.completed > 0 ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}>
                  {day.completed || ''}
                </span>
                {/* 柱状 */}
                <div className="w-full flex items-end" style={{ height: '100px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-primary-500 to-primary-400'
                        : day.completed > 0
                          ? 'bg-primary-200 dark:bg-primary-800'
                          : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                    style={{ height: `${Math.max(barHeight, 4)}%` }}
                  />
                </div>
                {/* 日期标签 */}
                <div className="text-center">
                  <p className={`text-xs ${isToday ? 'text-primary-500 font-medium' : 'text-gray-400'}`}>
                    {day.dayOfWeek}
                  </p>
                  <p className="text-[10px] text-gray-300 dark:text-gray-600">{day.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 连续坚持 */}
      <div className="bg-gradient-to-r from-primary-500 to-eye-500 rounded-xl p-4 shadow-sm text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70">连续坚持</p>
            <p className="text-3xl font-bold tabular-nums mt-1">
              {streak} <span className="text-lg font-normal text-white/80">天</span>
            </p>
          </div>
          <div className="text-4xl opacity-30">🔥</div>
        </div>
      </div>
    </>
  )
}

// ---- 通用组件 ----

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
