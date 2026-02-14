import { useState, useEffect, useCallback } from 'react'

interface Settings {
  general: {
    autoLaunch: boolean
    language: string
    theme: string
  }
  reminder: {
    miniBreak: { enabled: boolean; interval: number; duration: number }
    longBreak: { enabled: boolean; interval: number; duration: number }
    notificationMode: string
    soundEnabled: boolean
    soundVolume: number
    skipButtonDelay: number
  }
  smart: {
    idleDetectionEnabled: boolean
    idleThreshold: number
    dndAware: boolean
    fullscreenDetection: boolean
    strictMode: boolean
  }
}

type TabType = 'reminder' | 'smart' | 'general'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('reminder')
  const [saved, setSaved] = useState(false)

  // 加载设置
  useEffect(() => {
    window.api.settings.get().then(setSettings)
  }, [])

  // 保存设置
  const saveSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      const result = await window.api.settings.set(newSettings)
      setSettings(result)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
    []
  )

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-400">加载中...</p>
      </div>
    )
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'reminder', label: '提醒' },
    { key: 'smart', label: '智能' },
    { key: 'general', label: '通用' }
  ]

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* 侧边导航 */}
      <div className="w-40 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">⚙️ 设置</h1>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* 保存成功提示 */}
        {saved && (
          <div className="fixed top-4 right-4 bg-eye-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg animate-fade-in z-50">
            ✓ 设置已保存
          </div>
        )}

        {activeTab === 'reminder' && (
          <ReminderTab settings={settings} onSave={saveSettings} />
        )}
        {activeTab === 'smart' && (
          <SmartTab settings={settings} onSave={saveSettings} />
        )}
        {activeTab === 'general' && (
          <GeneralTab settings={settings} onSave={saveSettings} />
        )}
      </div>
    </div>
  )
}

// ---- 提醒设置 Tab ----
function ReminderTab({
  settings,
  onSave
}: {
  settings: Settings
  onSave: (s: Partial<Settings>) => void
}) {
  const { reminder } = settings

  const updateMiniBreak = (key: string, value: number | boolean) => {
    onSave({
      reminder: {
        ...reminder,
        miniBreak: { ...reminder.miniBreak, [key]: value }
      }
    })
  }

  const updateLongBreak = (key: string, value: number | boolean) => {
    onSave({
      reminder: {
        ...reminder,
        longBreak: { ...reminder.longBreak, [key]: value }
      }
    })
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-medium text-gray-800 dark:text-white">提醒设置</h2>

      {/* Mini Break */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white">短休息 (Mini Break)</h3>
            <p className="text-xs text-gray-400 mt-1">基于 20-20-20 法则的短暂远眺</p>
          </div>
          <ToggleSwitch
            checked={reminder.miniBreak.enabled}
            onChange={(v) => updateMiniBreak('enabled', v)}
          />
        </div>
        {reminder.miniBreak.enabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <SliderField
              label="提醒间隔"
              value={reminder.miniBreak.interval}
              min={10}
              max={60}
              step={5}
              unit="分钟"
              onChange={(v) => updateMiniBreak('interval', v)}
            />
            <SliderField
              label="休息时长"
              value={reminder.miniBreak.duration}
              min={10}
              max={60}
              step={5}
              unit="秒"
              onChange={(v) => updateMiniBreak('duration', v)}
            />
          </div>
        )}
      </section>

      {/* Long Break */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white">长休息 (Long Break)</h3>
            <p className="text-xs text-gray-400 mt-1">活动身体、放松肩颈的较长休息</p>
          </div>
          <ToggleSwitch
            checked={reminder.longBreak.enabled}
            onChange={(v) => updateLongBreak('enabled', v)}
          />
        </div>
        {reminder.longBreak.enabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <SliderField
              label="提醒间隔"
              value={reminder.longBreak.interval}
              min={30}
              max={180}
              step={15}
              unit="分钟"
              onChange={(v) => updateLongBreak('interval', v)}
            />
            <SliderField
              label="休息时长"
              value={Math.floor(reminder.longBreak.duration / 60)}
              min={1}
              max={15}
              step={1}
              unit="分钟"
              onChange={(v) => updateLongBreak('duration', v * 60)}
            />
          </div>
        )}
      </section>

      {/* 声音 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white">声音提示</h3>
            <p className="text-xs text-gray-400 mt-1">休息开始和结束时播放提示音</p>
          </div>
          <ToggleSwitch
            checked={reminder.soundEnabled}
            onChange={(v) => onSave({ reminder: { ...reminder, soundEnabled: v } })}
          />
        </div>
      </section>
    </div>
  )
}

// ---- 智能设置 Tab ----
function SmartTab({
  settings,
  onSave
}: {
  settings: Settings
  onSave: (s: Partial<Settings>) => void
}) {
  const { smart } = settings

  const update = (key: string, value: boolean | number) => {
    onSave({ smart: { ...smart, [key]: value } })
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-medium text-gray-800 dark:text-white">智能设置</h2>

      <section className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
        <ToggleField
          label="空闲检测"
          description="检测到用户空闲时自动暂停计时"
          checked={smart.idleDetectionEnabled}
          onChange={(v) => update('idleDetectionEnabled', v)}
        />

        {smart.idleDetectionEnabled && (
          <SliderField
            label="空闲阈值"
            value={smart.idleThreshold}
            min={1}
            max={15}
            step={1}
            unit="分钟"
            onChange={(v) => update('idleThreshold', v)}
          />
        )}

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <ToggleField
            label="免打扰感知"
            description="系统开启免打扰模式时自动暂停提醒"
            checked={smart.dndAware}
            onChange={(v) => update('dndAware', v)}
          />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <ToggleField
            label="全屏应用检测"
            description="检测到全屏应用（演示/游戏）时暂停提醒"
            checked={smart.fullscreenDetection}
            onChange={(v) => update('fullscreenDetection', v)}
          />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <ToggleField
            label="严格模式"
            description="休息期间隐藏跳过按钮，检测鼠标活动重置倒计时"
            checked={smart.strictMode}
            onChange={(v) => update('strictMode', v)}
          />
        </div>
      </section>
    </div>
  )
}

// ---- 通用设置 Tab ----
function GeneralTab({
  settings,
  onSave
}: {
  settings: Settings
  onSave: (s: Partial<Settings>) => void
}) {
  const { general } = settings

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-medium text-gray-800 dark:text-white">通用设置</h2>

      <section className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
        <ToggleField
          label="开机自启动"
          description="系统启动时自动运行青眸"
          checked={general.autoLaunch}
          onChange={(v) => onSave({ general: { ...general, autoLaunch: v } })}
        />

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">主题</p>
              <p className="text-xs text-gray-400 mt-1">选择应用外观主题</p>
            </div>
            <select
              value={general.theme}
              onChange={(e) => onSave({ general: { ...general, theme: e.target.value } })}
              className="text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">语言</p>
              <p className="text-xs text-gray-400 mt-1">选择界面语言</p>
            </div>
            <select
              value={general.language}
              onChange={(e) => onSave({ general: { ...general, language: e.target.value } })}
              className="text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
            >
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
      </section>

      {/* 关于 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-medium text-gray-800 dark:text-white mb-3">关于青眸</h3>
        <div className="text-sm text-gray-500 space-y-1">
          <p>版本: v1.0.0</p>
          <p>基于 20-20-20 法则的智能护眼提醒</p>
          <p className="text-xs text-gray-400 mt-2">Made with ❤️ for your eyes</p>
        </div>
      </section>
    </div>
  )
}

// ========== 通用 UI 组件 ==========

function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function ToggleField({
  label,
  description,
  checked,
  onChange
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-sm font-medium text-primary-600 dark:text-primary-400 tabular-nums">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-500"
      />
    </div>
  )
}
