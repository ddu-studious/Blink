import { useState, useEffect, useCallback, useMemo } from 'react'

// ---- 类型定义 ----

type RestScreenMode = 'classic' | 'nature' | 'breathing' | 'eyeTraining' | 'darkScreen'
type AmbientSoundType = 'birds' | 'stream' | 'waves' | 'wind' | 'rain'

interface ShortcutSettings {
  togglePause: string
  takeBreak: string
  skipBreak: string
}

interface Settings {
  general: {
    autoLaunch: boolean
    language: string
    theme: string
    globalShortcuts: ShortcutSettings
  }
  reminder: {
    miniBreak: { enabled: boolean; interval: number; duration: number }
    longBreak: { enabled: boolean; interval: number; duration: number }
    notificationMode: string
    soundEnabled: boolean
    soundVolume: number
    skipButtonDelay: number
    restScreen: {
      miniBreakMode: RestScreenMode
      longBreakMode: RestScreenMode
      ambientSoundEnabled: boolean
      ambientSoundType: AmbientSoundType
    }
  }
  smart: {
    idleDetectionEnabled: boolean
    idleThreshold: number
    dndAware: boolean
    fullscreenDetection: boolean
    strictMode: boolean
    workSchedule: {
      enabled: boolean
      startTime: string
      endTime: string
      daysOfWeek: number[]
    }
  }
}

type TabType = 'reminder' | 'appearance' | 'smart' | 'restScreen' | 'shortcuts' | 'general' | 'about'

// 侧边栏导航配置（含搜索关键词）
const NAV_ITEMS: { key: TabType; label: string; icon: string; gradient: string; keywords: string[] }[] = [
  { key: 'reminder', label: '提醒', icon: '🔔', gradient: 'from-blue-400 to-blue-600', keywords: ['提醒', '短休息', '长休息', 'mini', 'long', 'break', '间隔', '时长', '声音', '通知', '音量', '跳过'] },
  { key: 'appearance', label: '外观', icon: '🎨', gradient: 'from-orange-400 to-orange-600', keywords: ['外观', '主题', '深色', '浅色', '暗色', '亮色', 'theme', 'dark', 'light', '语言', 'language'] },
  { key: 'smart', label: '智能', icon: '🧠', gradient: 'from-purple-400 to-purple-600', keywords: ['智能', '空闲', 'idle', '免打扰', '全屏', '严格', '工作时段', '时间'] },
  { key: 'restScreen', label: '休息屏幕', icon: '🌿', gradient: 'from-teal-400 to-teal-600', keywords: ['休息', '屏幕', '自然', '呼吸', '眼部', '训练', '暗屏', '音效', '环境音'] },
  { key: 'shortcuts', label: '快捷键', icon: '⌨️', gradient: 'from-pink-400 to-pink-600', keywords: ['快捷键', 'shortcut', '暂停', '恢复', '立即休息', '跳过'] },
  { key: 'general', label: '通用', icon: '⚙️', gradient: 'from-gray-400 to-gray-600', keywords: ['通用', '自启动', '开机', 'auto', 'launch'] }
]

const ABOUT_NAV = { key: 'about' as TabType, label: '关于', icon: 'ℹ️', gradient: 'from-sky-400 to-sky-600', keywords: ['关于', 'about', '版本', 'version'] }

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('reminder')
  const [saved, setSaved] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return NAV_ITEMS
    const q = searchQuery.toLowerCase()
    return NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(q))
    )
  }, [searchQuery])

  const showAbout = useMemo(() => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return ABOUT_NAV.label.toLowerCase().includes(q) ||
      ABOUT_NAV.keywords.some((kw) => kw.toLowerCase().includes(q))
  }, [searchQuery])

  // 搜索时自动跳转到第一个匹配项
  useEffect(() => {
    if (!searchQuery.trim()) return
    if (filteredNavItems.length > 0) {
      const alreadyVisible = filteredNavItems.some((item) => item.key === activeTab) ||
        (showAbout && activeTab === 'about')
      if (!alreadyVisible) {
        setActiveTab(filteredNavItems[0].key)
      }
    } else if (showAbout) {
      setActiveTab('about')
    }
  }, [searchQuery, filteredNavItems, showAbout])

  // 加载设置
  useEffect(() => {
    window.api.settings.get().then((s: Settings) => {
      if (!s.reminder.restScreen) {
        s.reminder.restScreen = {
          miniBreakMode: 'classic',
          longBreakMode: 'nature',
          ambientSoundEnabled: true,
          ambientSoundType: 'birds'
        }
      }
      setSettings(s)
    })
  }, [])

  // 保存设置
  const saveSettings = useCallback(async (newSettings: Partial<Settings>) => {
    const result = await window.api.settings.set(newSettings)
    setSettings(result)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-[#1e1e1e]">
        <p className="text-gray-400 text-[13px]">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-100 dark:bg-[#1e1e1e]">
      {/* Apple 风格侧边栏 */}
      <div className="w-[200px] bg-gray-50/80 dark:bg-[#252525] border-r border-gray-200/80 dark:border-[#333] p-3 space-y-0.5 overflow-y-auto flex-shrink-0">
        {/* 搜索栏 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-200/60 dark:bg-[#333] rounded-lg mb-3">
          <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索"
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 导航项 */}
        {filteredNavItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-colors ${
              activeTab === item.key
                ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333]'
            }`}
          >
            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
              <span className="text-white text-[10px]">{item.icon}</span>
            </div>
            {item.label}
          </button>
        ))}

        {filteredNavItems.length === 0 && !showAbout && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-4">无匹配结果</p>
        )}

        {/* 分割线 + 关于 */}
        {showAbout && (
          <div className="pt-2 mt-2 border-t border-gray-200/60 dark:border-[#333]">
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-colors ${
                activeTab === 'about'
                  ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333]'
              }`}
            >
              <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${ABOUT_NAV.gradient} flex items-center justify-center`}>
                <span className="text-white text-[10px]">{ABOUT_NAV.icon}</span>
              </div>
              {ABOUT_NAV.label}
            </button>
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* 保存成功提示 */}
        {saved && (
          <div className="fixed top-4 right-4 bg-eye-500 text-white px-4 py-2 rounded-lg text-[12px] shadow-lg animate-fade-in z-50">
            ✓ 设置已保存
          </div>
        )}

        {activeTab === 'reminder' && <ReminderSection settings={settings} onSave={saveSettings} />}
        {activeTab === 'appearance' && <AppearanceSection settings={settings} onSave={saveSettings} />}
        {activeTab === 'smart' && <SmartSection settings={settings} onSave={saveSettings} />}
        {activeTab === 'restScreen' && <RestScreenSection settings={settings} onSave={saveSettings} />}
        {activeTab === 'shortcuts' && <ShortcutsSection settings={settings} onSave={saveSettings} />}
        {activeTab === 'general' && <GeneralSection settings={settings} onSave={saveSettings} />}
        {activeTab === 'about' && <AboutSection />}
      </div>
    </div>
  )
}

// ========================================================
// 提醒设置
// ========================================================
function ReminderSection({ settings, onSave }: { settings: Settings; onSave: (s: Partial<Settings>) => void }) {
  const { reminder } = settings

  const updateMiniBreak = (key: string, value: number | boolean) => {
    onSave({ reminder: { ...reminder, miniBreak: { ...reminder.miniBreak, [key]: value } } })
  }

  const updateLongBreak = (key: string, value: number | boolean) => {
    onSave({ reminder: { ...reminder, longBreak: { ...reminder.longBreak, [key]: value } } })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-200 mb-4">提醒设置</h2>

      {/* 短休息 */}
      <Card>
        <CardRow>
          <div className="flex items-center gap-3">
            <IconBox icon="⏱" bg="bg-primary-100 dark:bg-primary-900/50" />
            <div>
              <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">短休息 (Mini Break)</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">基于 20-20-20 法则的短暂远眺</p>
            </div>
          </div>
          <AppleToggle checked={reminder.miniBreak.enabled} onChange={(v) => updateMiniBreak('enabled', v)} />
        </CardRow>
        {reminder.miniBreak.enabled && (
          <>
            <CardDivider />
            <CardRow>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">提醒间隔</span>
              <InlineSlider value={reminder.miniBreak.interval} min={10} max={60} step={5} unit="分钟" onChange={(v) => updateMiniBreak('interval', v)} />
            </CardRow>
            <CardDividerThin />
            <CardRow>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">休息时长</span>
              <InlineSlider value={reminder.miniBreak.duration} min={10} max={60} step={5} unit="秒" onChange={(v) => updateMiniBreak('duration', v)} />
            </CardRow>
          </>
        )}
      </Card>

      {/* 长休息 */}
      <Card>
        <CardRow>
          <div className="flex items-center gap-3">
            <IconBox icon="🧘" bg="bg-eye-100 dark:bg-eye-900/50" />
            <div>
              <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">长休息 (Long Break)</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">活动身体、放松肩颈的较长休息</p>
            </div>
          </div>
          <AppleToggle checked={reminder.longBreak.enabled} onChange={(v) => updateLongBreak('enabled', v)} />
        </CardRow>
        {reminder.longBreak.enabled && (
          <>
            <CardDivider />
            <CardRow>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">提醒间隔</span>
              <InlineSlider value={reminder.longBreak.interval} min={30} max={180} step={15} unit="分钟" color="accent-eye-500" onChange={(v) => updateLongBreak('interval', v)} />
            </CardRow>
            <CardDividerThin />
            <CardRow>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">休息时长</span>
              <InlineSlider
                value={Math.floor(reminder.longBreak.duration / 60)}
                min={1} max={15} step={1} unit="分钟" color="accent-eye-500"
                onChange={(v) => updateLongBreak('duration', v * 60)}
              />
            </CardRow>
          </>
        )}
      </Card>

      {/* 声音与通知 */}
      <Card>
        <CardRow>
          <div className="flex items-center gap-3">
            <IconBox icon="🔊" bg="bg-amber-100 dark:bg-amber-900/50" />
            <div>
              <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">声音提示</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">休息开始和结束时播放提示音</p>
            </div>
          </div>
          <AppleToggle
            checked={reminder.soundEnabled}
            onChange={(v) => onSave({ reminder: { ...reminder, soundEnabled: v } })}
          />
        </CardRow>
        {reminder.soundEnabled && (
          <>
            <CardDivider />
            <CardRow>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">音量</span>
              <InlineSlider value={reminder.soundVolume} min={0} max={100} step={10} unit="%" onChange={(v) => onSave({ reminder: { ...reminder, soundVolume: v } })} />
            </CardRow>
          </>
        )}
        <CardDivider />
        <CardRow>
          <span className="text-[13px] text-gray-600 dark:text-gray-400">提醒方式</span>
          <SegmentedControl
            options={[
              { value: 'overlay', label: '全屏覆盖' },
              { value: 'notification', label: '仅通知' },
              { value: 'both', label: '两者' }
            ]}
            value={reminder.notificationMode}
            onChange={(v) => onSave({ reminder: { ...reminder, notificationMode: v } })}
          />
        </CardRow>
        <CardDividerThin />
        <CardRow>
          <span className="text-[13px] text-gray-600 dark:text-gray-400">跳过按钮延迟</span>
          <InlineSlider value={reminder.skipButtonDelay} min={0} max={30} step={1} unit="秒" onChange={(v) => onSave({ reminder: { ...reminder, skipButtonDelay: v } })} />
        </CardRow>
      </Card>
    </div>
  )
}

// ========================================================
// 外观设置
// ========================================================
function AppearanceSection({ settings, onSave }: { settings: Settings; onSave: (s: Partial<Settings>) => void }) {
  const { general } = settings

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-200 mb-4">外观</h2>

      {/* 主题选择 */}
      <Card>
        <div className="px-4 py-4">
          <p className="text-[13px] font-medium text-gray-700 dark:text-gray-200 mb-3">主题</p>
          <div className="flex gap-4 justify-center">
            {[
              { value: 'light', label: '浅色', bg: 'from-white to-gray-100', inner: 'bg-white border-gray-200' },
              { value: 'dark', label: '深色', bg: 'from-gray-800 to-gray-900', inner: 'bg-gray-800 border-gray-600' },
              { value: 'system', label: '自动', bg: '', inner: '' }
            ].map((t) => (
              <label key={t.value} className="cursor-pointer text-center">
                <input
                  type="radio"
                  name="theme"
                  className="sr-only peer"
                  checked={general.theme === t.value}
                  onChange={() => onSave({ general: { ...general, theme: t.value } })}
                />
                <div className={`w-20 h-14 rounded-lg border-2 border-gray-200 dark:border-[#444] peer-checked:border-primary-500 mb-1.5 flex items-end justify-center pb-1 transition-all overflow-hidden ${
                  t.value === 'system'
                    ? ''
                    : `bg-gradient-to-b ${t.bg}`
                }`}
                  style={t.value === 'system' ? { background: 'linear-gradient(to right, #f5f5f5 50%, #1f2937 50%)' } : undefined}
                >
                  <div className={`w-14 h-8 rounded-t border shadow-sm ${
                    t.value === 'system'
                      ? ''
                      : t.inner
                  }`}
                    style={t.value === 'system' ? { background: 'linear-gradient(to right, white 50%, #374151 50%)', borderColor: '#d1d5db' } : undefined}
                  />
                </div>
                <p className={`text-[11px] ${general.theme === t.value ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-500'}`}>
                  {t.label}
                </p>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* 语言 */}
      <Card>
        <CardRow>
          <div className="flex items-center gap-3">
            <IconBox icon="🌐" bg="bg-indigo-100 dark:bg-indigo-900/50" />
            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">语言</p>
          </div>
          <select
            value={general.language}
            onChange={(e) => onSave({ general: { ...general, language: e.target.value } })}
            className="text-[12px] bg-gray-100 dark:bg-[#333] border-0 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 font-medium focus:ring-2 focus:ring-primary-500"
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </CardRow>
      </Card>
    </div>
  )
}

// ========================================================
// 智能设置
// ========================================================
function SmartSection({ settings, onSave }: { settings: Settings; onSave: (s: Partial<Settings>) => void }) {
  const { smart } = settings

  const update = (key: string, value: boolean | number) => {
    onSave({ smart: { ...smart, [key]: value } })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-200 mb-4">智能设置</h2>

      <Card>
        <CardRow>
          <div>
            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">空闲检测</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">检测到用户空闲时自动暂停计时</p>
          </div>
          <AppleToggle checked={smart.idleDetectionEnabled} onChange={(v) => update('idleDetectionEnabled', v)} />
        </CardRow>
        {smart.idleDetectionEnabled && (
          <>
            <CardDividerThin />
            <CardRow>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">空闲阈值</span>
              <InlineSlider value={smart.idleThreshold} min={1} max={15} step={1} unit="分钟" onChange={(v) => update('idleThreshold', v)} />
            </CardRow>
          </>
        )}
        <CardDivider />
        <CardRow>
          <div>
            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">免打扰感知</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">系统开启免打扰模式时自动暂停提醒</p>
          </div>
          <AppleToggle checked={smart.dndAware} onChange={(v) => update('dndAware', v)} />
        </CardRow>
        <CardDivider />
        <CardRow>
          <div>
            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">全屏应用检测</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">检测到全屏应用（演示/游戏）时暂停提醒</p>
          </div>
          <AppleToggle checked={smart.fullscreenDetection} onChange={(v) => update('fullscreenDetection', v)} />
        </CardRow>
        <CardDivider />
        <CardRow>
          <div>
            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">严格模式</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">休息期间隐藏跳过按钮，检测鼠标活动重置倒计时</p>
          </div>
          <AppleToggle checked={smart.strictMode} onChange={(v) => update('strictMode', v)} />
        </CardRow>
      </Card>

      {/* 工作时段 */}
      <Card>
        <CardRow>
          <div>
            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">工作时段</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">仅在设定时段内启用提醒</p>
          </div>
          <AppleToggle
            checked={smart.workSchedule?.enabled || false}
            onChange={(v) => onSave({ smart: { ...smart, workSchedule: { ...smart.workSchedule, enabled: v } } })}
          />
        </CardRow>
        {smart.workSchedule?.enabled && (
          <>
            <CardDivider />
            <CardRow>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">开始时间</span>
              <input
                type="time"
                value={smart.workSchedule.startTime}
                onChange={(e) => onSave({ smart: { ...smart, workSchedule: { ...smart.workSchedule, startTime: e.target.value } } })}
                className="text-[12px] bg-gray-100 dark:bg-[#333] border-0 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300"
              />
            </CardRow>
            <CardDividerThin />
            <CardRow>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">结束时间</span>
              <input
                type="time"
                value={smart.workSchedule.endTime}
                onChange={(e) => onSave({ smart: { ...smart, workSchedule: { ...smart.workSchedule, endTime: e.target.value } } })}
                className="text-[12px] bg-gray-100 dark:bg-[#333] border-0 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300"
              />
            </CardRow>
            <CardDividerThin />
            <div className="px-4 py-3">
              <span className="text-[13px] text-gray-600 dark:text-gray-400 block mb-2">工作日</span>
              <div className="flex gap-2">
                {['日', '一', '二', '三', '四', '五', '六'].map((day, i) => {
                  const isActive = smart.workSchedule.daysOfWeek?.includes(i)
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const days = smart.workSchedule.daysOfWeek || []
                        const newDays = isActive ? days.filter((d) => d !== i) : [...days, i].sort()
                        onSave({ smart: { ...smart, workSchedule: { ...smart.workSchedule, daysOfWeek: newDays } } })
                      }}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-[#333] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#444]'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

// ========================================================
// 休息屏幕设置
// ========================================================

const REST_MODES: { value: RestScreenMode; label: string; desc: string; previewGradient: string; previewIcon: string }[] = [
  { value: 'classic', label: '经典模式', desc: '倒计时+提示', previewGradient: 'from-gray-900 to-gray-800', previewIcon: ':20' },
  { value: 'nature', label: '自然风光', desc: '沉浸放松', previewGradient: 'from-green-800 to-green-600', previewIcon: '🌲' },
  { value: 'breathing', label: '呼吸引导', desc: '减压冥想', previewGradient: 'from-slate-900 to-gray-900', previewIcon: '' },
  { value: 'eyeTraining', label: '眼部训练', desc: '专业护眼', previewGradient: 'from-indigo-950 to-gray-900', previewIcon: '👁️' },
  { value: 'darkScreen', label: '纯黑暗屏', desc: '极致休息', previewGradient: '', previewIcon: '' }
]

const SOUND_OPTIONS: { value: AmbientSoundType; label: string }[] = [
  { value: 'birds', label: '鸟鸣森林' },
  { value: 'stream', label: '溪流流水' },
  { value: 'waves', label: '海浪声' },
  { value: 'wind', label: '风声' },
  { value: 'rain', label: '雨声' }
]

function RestScreenSection({ settings, onSave }: { settings: Settings; onSave: (s: Partial<Settings>) => void }) {
  const { reminder } = settings
  const restScreen = reminder.restScreen

  const updateRestScreen = (key: string, value: string | boolean) => {
    onSave({ reminder: { ...reminder, restScreen: { ...restScreen, [key]: value } } })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-200 mb-1">休息屏幕</h2>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">可分别为短休息和长休息选择不同模式</p>

      {/* 短休息模式选择 */}
      <Card>
        <div className="px-4 py-3.5">
          <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">短休息样式</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">20 秒远眺时使用的界面</p>
        </div>
        <CardDivider />
        <div className="px-4 py-3">
          <div className="grid grid-cols-5 gap-2.5">
            {REST_MODES.map((mode) => (
              <ModeCard
                key={mode.value}
                mode={mode}
                selected={restScreen.miniBreakMode === mode.value}
                onSelect={() => updateRestScreen('miniBreakMode', mode.value)}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* 长休息模式选择 */}
      <Card>
        <div className="px-4 py-3.5">
          <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">长休息样式</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">5 分钟活动时使用的界面</p>
        </div>
        <CardDivider />
        <div className="px-4 py-3">
          <div className="grid grid-cols-5 gap-2.5">
            {REST_MODES.map((mode) => (
              <ModeCard
                key={mode.value}
                mode={mode}
                selected={restScreen.longBreakMode === mode.value}
                onSelect={() => updateRestScreen('longBreakMode', mode.value)}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* 环境音效 */}
      <Card>
        <CardRow>
          <div>
            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">环境音效</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">自然风光模式时播放背景音</p>
          </div>
          <AppleToggle
            checked={restScreen.ambientSoundEnabled}
            onChange={(v) => updateRestScreen('ambientSoundEnabled', v)}
          />
        </CardRow>
        {restScreen.ambientSoundEnabled && (
          <>
            <CardDivider />
            <CardRow>
              <span className="text-[13px] text-gray-600 dark:text-gray-400">音效类型</span>
              <select
                value={restScreen.ambientSoundType}
                onChange={(e) => updateRestScreen('ambientSoundType', e.target.value)}
                className="text-[12px] bg-gray-100 dark:bg-[#333] border-0 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 font-medium focus:ring-2 focus:ring-primary-500"
              >
                {SOUND_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </CardRow>
          </>
        )}
      </Card>
    </div>
  )
}

// 模式卡片预览
function ModeCard({
  mode,
  selected,
  onSelect
}: {
  mode: (typeof REST_MODES)[0]
  selected: boolean
  onSelect: () => void
}) {
  return (
    <label className="cursor-pointer group">
      <input type="radio" className="sr-only peer" checked={selected} onChange={onSelect} />
      <div className="rounded-xl border-2 border-gray-200 dark:border-[#444] peer-checked:border-primary-500 peer-checked:bg-primary-50/50 dark:peer-checked:bg-primary-900/20 overflow-hidden transition-all">
        <div className={`h-16 flex items-center justify-center ${
          mode.value === 'darkScreen' ? 'bg-black' : `bg-gradient-to-br ${mode.previewGradient}`
        }`}>
          {mode.value === 'classic' && (
            <div className="w-8 h-8 rounded-full border-2 border-primary-400/50 flex items-center justify-center">
              <span className="text-[10px] text-white/60 font-light">{mode.previewIcon}</span>
            </div>
          )}
          {mode.value === 'nature' && <span className="text-xl z-10">{mode.previewIcon}</span>}
          {mode.value === 'breathing' && (
            <div className="w-8 h-8 rounded-full bg-teal-400/20 border border-teal-400/30 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-teal-400/30" />
            </div>
          )}
          {mode.value === 'eyeTraining' && <span className="text-xl">{mode.previewIcon}</span>}
          {mode.value === 'darkScreen' && <span className="text-[10px] text-white/10">:20</span>}
        </div>
        <div className="p-1.5 text-center">
          <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 leading-tight">{mode.label}</p>
          <p className="text-[8px] text-gray-400 dark:text-gray-500">{mode.desc}</p>
        </div>
      </div>
    </label>
  )
}

// ========================================================
// 快捷键设置
// ========================================================
function ShortcutsSection({ settings, onSave }: { settings: Settings; onSave: (s: Partial<Settings>) => void }) {
  const { general } = settings

  const updateShortcut = (key: string, value: string) => {
    onSave({ general: { ...general, globalShortcuts: { ...general.globalShortcuts, [key]: value } } })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-200 mb-4">全局快捷键</h2>

      <Card>
        <div className="px-4 pt-3.5 pb-2">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">自定义全局快捷键（点击录制，留空可禁用）</p>
        </div>
        <CardDivider />
        <CardRow>
          <span className="text-[13px] text-gray-600 dark:text-gray-400">暂停/恢复</span>
          <ShortcutRecorder value={general.globalShortcuts?.togglePause || ''} onChange={(v) => updateShortcut('togglePause', v)} />
        </CardRow>
        <CardDividerThin />
        <CardRow>
          <span className="text-[13px] text-gray-600 dark:text-gray-400">立即休息</span>
          <ShortcutRecorder value={general.globalShortcuts?.takeBreak || ''} onChange={(v) => updateShortcut('takeBreak', v)} />
        </CardRow>
        <CardDividerThin />
        <CardRow>
          <span className="text-[13px] text-gray-600 dark:text-gray-400">跳过休息</span>
          <ShortcutRecorder value={general.globalShortcuts?.skipBreak || ''} onChange={(v) => updateShortcut('skipBreak', v)} />
        </CardRow>
      </Card>
    </div>
  )
}

// ========================================================
// 通用设置
// ========================================================
function GeneralSection({ settings, onSave }: { settings: Settings; onSave: (s: Partial<Settings>) => void }) {
  const { general } = settings

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-200 mb-4">通用</h2>

      <Card>
        <CardRow>
          <div>
            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200">开机自启动</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">系统启动时自动运行青眸</p>
          </div>
          <AppleToggle checked={general.autoLaunch} onChange={(v) => onSave({ general: { ...general, autoLaunch: v } })} />
        </CardRow>
      </Card>
    </div>
  )
}

// ========================================================
// 关于
// ========================================================
function AboutSection() {
  // 获取应用图标路径
  const iconSrc = new URL(
    '../../../../../resources/icons/icon-128.png',
    import.meta.url
  ).href

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-200 mb-4">关于青眸</h2>

      <Card>
        <div className="px-4 py-6 flex flex-col items-center text-center space-y-3">
          <img
            src={iconSrc}
            alt="青眸 QingMou"
            className="w-20 h-20 rounded-[18px] shadow-lg"
            draggable={false}
          />
          <div>
            <p className="text-[15px] font-semibold text-gray-800 dark:text-gray-200">青眸 QingMou</p>
            <p className="text-[12px] text-gray-400 mt-1">版本 v1.0.0</p>
          </div>
          <p className="text-[12px] text-gray-500 max-w-xs leading-relaxed">
            基于 20-20-20 法则的智能护眼提醒应用，帮助您在数字世界中保护双眼。
          </p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-2">Made with ❤️ for your eyes</p>
        </div>
      </Card>
    </div>
  )
}

// ========================================================
// Apple 风格通用 UI 组件
// ========================================================

/** 白色圆角卡片容器 */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
      {children}
    </div>
  )
}

/** 卡片行 - 水平两端对齐 */
function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      {children}
    </div>
  )
}

/** 分割线 */
function CardDivider() {
  return <div className="border-t border-gray-100 dark:border-[#333]" />
}

/** 浅分割线 */
function CardDividerThin() {
  return <div className="border-t border-gray-50 dark:border-[#333]" />
}

/** 方形图标盒子 */
function IconBox({ icon, bg }: { icon: string; bg: string }) {
  return (
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
      <span className="text-sm">{icon}</span>
    </div>
  )
}

/** Apple 风格 Toggle 开关 (h-[22px] w-[40px]) */
function AppleToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-shrink-0 ${
        checked ? 'bg-eye-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[20px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  )
}

/** 行内滑块 */
function InlineSlider({
  value, min, max, step, unit, color = 'accent-primary-500', onChange
}: {
  value: number; min: number; max: number; step: number; unit: string
  color?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className={`w-28 h-1 bg-gray-200 dark:bg-[#444] rounded-full appearance-none cursor-pointer ${color}`}
      />
      <span className="text-[12px] font-medium text-primary-600 dark:text-primary-400 w-14 text-right tabular-nums">
        {value} {unit}
      </span>
    </div>
  )
}

/** 分段控制器 (Apple Segmented Control) */
function SegmentedControl({
  options, value, onChange
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex bg-gray-100 dark:bg-[#333] rounded-lg p-0.5 text-[11px]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-md transition-colors ${
            value === opt.value
              ? 'bg-white dark:bg-[#444] text-gray-800 dark:text-gray-200 shadow-sm font-medium'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/** 快捷键录制器 */
function ShortcutRecorder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [recording, setRecording] = useState(false)
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const formatShortcut = (shortcut: string): string => {
    if (!shortcut) return '未设置'
    return shortcut
      .replace('CommandOrControl', navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
      .replace('Shift', navigator.platform.includes('Mac') ? '⇧' : 'Shift')
      .replace('Alt', navigator.platform.includes('Mac') ? '⌥' : 'Alt')
      .replace(/\+/g, ' + ')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return
    e.preventDefault()
    e.stopPropagation()

    const parts: string[] = []
    if (e.ctrlKey || e.metaKey) parts.push('CommandOrControl')
    if (e.shiftKey) parts.push('Shift')
    if (e.altKey) parts.push('Alt')

    const key = e.key
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return

    const keyMap: Record<string, string> = {
      ' ': 'Space', 'Escape': 'Escape', 'Backspace': 'Backspace',
      'Delete': 'Delete', 'Enter': 'Enter', 'Tab': 'Tab',
      'ArrowUp': 'Up', 'ArrowDown': 'Down', 'ArrowLeft': 'Left', 'ArrowRight': 'Right'
    }

    const mappedKey = keyMap[key] || key.toUpperCase()
    parts.push(mappedKey)

    if (parts.length >= 2) {
      const shortcut = parts.join('+')
      setDisplayValue(shortcut)
      setRecording(false)
      onChange(shortcut)
    }
  }

  return (
    <button
      onClick={() => setRecording(true)}
      onKeyDown={handleKeyDown}
      onBlur={() => setRecording(false)}
      className={`text-[11px] px-3 py-1.5 rounded-lg min-w-[140px] text-center transition-colors ${
        recording
          ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 border-2 border-primary-400 dark:border-primary-600 animate-pulse'
          : 'bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#444] hover:border-primary-300 dark:hover:border-primary-600'
      }`}
    >
      {recording ? '按下快捷键...' : formatShortcut(displayValue)}
    </button>
  )
}
