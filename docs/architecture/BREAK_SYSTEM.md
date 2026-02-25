# 休息系统架构文档

**版本**: v1.4.0
**创建日期**: 2026-02-25
**状态**: 已完成

## 概述

青眸的休息系统基于 20-20-20 法则，采用**双级休息机制**（短休息 + 长休息），支持 7 种休息屏幕模式，具备智能场景感知和多显示器覆盖能力。

---

## 1. 双级休息机制

### 1.1 短休息 (Mini Break)

| 属性 | 默认值 | 可配置范围 |
|------|--------|------------|
| 间隔 | 20 分钟 | 10-60 分钟 |
| 时长 | 20 秒 | 10-60 秒 |
| 可启用/禁用 | 启用 | - |

**设计目的**：遵循 20-20-20 法则，每 20 分钟看向 20 英尺（6 米）外远眺 20 秒，缓解眼部疲劳。

### 1.2 长休息 (Long Break)

| 属性 | 默认值 | 可配置范围 |
|------|--------|------------|
| 间隔 | 60 分钟 | 30-180 分钟 |
| 时长 | 300 秒 (5分钟) | 60-900 秒 |
| 可启用/禁用 | 启用 | - |

**设计目的**：每小时进行一次较长的休息，让身体充分放松，进行拉伸、正念等健康活动。

### 1.3 倒计时独立运行

短休息和长休息的倒计时**独立运行、互不影响**。当任意一个倒计时到 0 时，触发对应类型的休息。

---

## 2. 休息触发流程

### 2.1 自动触发

```
TimerManager.tick() [每秒执行]
  ├── status === 'running' → tickWork()
  │   ├── 检查工作时段 (workSchedule)
  │   ├── miniBreakCountdown-- (如果 miniBreak.enabled)
  │   │   ├── = 30 → emit('break-warning', { type: 'mini' })  [30秒预告]
  │   │   └── <= 0 → startBreak('mini')
  │   └── longBreakCountdown-- (如果 longBreak.enabled)
  │       ├── = 30 → emit('break-warning', { type: 'long' })  [30秒预告]
  │       └── <= 0 → startBreak('long')
  └── status === 'break' → tickBreak()
      └── breakCountdown-- → 到0时 completeBreak()
```

### 2.2 手动触发

| 触发方式 | 调用路径 | 说明 |
|---------|---------|------|
| 托盘菜单「立即休息」 | `timerManager.takeBreakNow('mini')` | 默认触发短休息 |
| 托盘菜单「健康活动」 | `timerManager.takeBreakNow(type, forceMode)` | 可指定休息类型和模式 |
| 全局快捷键 | `shortcutService → timerManager.takeBreakNow()` | 需开启快捷键 |
| 久坐检测通知 | `timerManager.takeBreakNow('long', 'stretch')` | 强制拉伸模式 |
| 下班提醒通知 | `timerManager.takeBreakNow('long', 'mindful')` | 强制正念模式 |
| 站立提醒通知 | `timerManager.takeBreakNow('long', 'stretch')` | 强制拉伸模式 |
| IPC 渲染进程调用 | `window.api.timer.takeBreak(type)` | 统计页操作 |

### 2.3 预告通知

倒计时到 **30 秒**时，根据 `notificationMode` 设置发送预告：

| notificationMode | 行为 |
|-----------------|------|
| `overlay` | 不发送预告通知（全屏覆盖本身是即时提醒） |
| `notification` | 发送系统通知 |
| `both` | 发送系统通知 |

---

## 3. 休息屏幕模式

### 3.1 可用模式一览

| 模式 | 标识 | 适用场景 | 说明 |
|------|------|---------|------|
| 经典模式 | `classic` | 短/长休息 | 倒计时进度环 + 护眼提示 + 运动视频推荐 |
| 自然风光 | `nature` | 短/长休息 | 6张高清自然风景照轮播（森林/海洋/山川/湖泊/草原/星空） |
| 呼吸引导 | `breathing` | 短/长休息 | 吸气4s → 屏住4s → 呼气6s 循环引导 |
| 眼部训练 | `eyeTraining` | 短/长休息 | 8字追踪/时钟运动/焦点切换/掌敷法 |
| 纯黑暗屏 | `darkScreen` | 短/长休息 | 纯黑背景 + 极简倒计时 |
| 拉伸引导 | `stretch` | 主要用于长休息 | 办公室拉伸动作引导 + 自动计时 + 视频教学 |
| 正念引导 | `mindful` | 主要用于长休息 | 正念练习引导 + 呼吸动画 |

### 3.2 模式选择优先级（关键逻辑）

休息屏幕模式的选择遵循以下优先级（从高到低）：

```
1. forceMode (手动触发时指定的模式)
     ↓ 未指定
2. 长休息自动引导 (仅长休息)
   a. exercise.stretchGuide.enabled + showInLongBreak → 'stretch'
   b. mindfulness.mindfulGuide.enabled + showInLongBreak → 'mindful'
     ↓ 未匹配
3. 用户设置
   a. 短休息 → restScreen.miniBreakMode (默认 'classic')
   b. 长休息 → restScreen.longBreakMode (默认 'nature')
```

**重要说明**：

当 `stretchGuide.showInLongBreak` 为 `true`（默认值）时，长休息会**始终**显示拉伸模式，**忽略** `restScreen.longBreakMode` 的设置。这意味着：

- 用户在「休息屏幕」设置中选择了「自然风光」作为长休息样式
- 但如果「运动健康 → 拉伸引导 → 长休息时显示」是开启的
- 实际长休息时显示的是**拉伸引导**，而非自然风光

如果用户想要长休息显示自然风光，需要关闭「长休息时显示拉伸引导」。

### 3.3 配置位置

| 设置项 | 配置路径 | 默认值 |
|-------|---------|--------|
| 短休息样式 | `reminder.restScreen.miniBreakMode` | `'classic'` |
| 长休息样式 | `reminder.restScreen.longBreakMode` | `'nature'` |
| 拉伸引导长休息 | `exercise.stretchGuide.showInLongBreak` | `true` |
| 正念引导长休息 | `mindfulness.mindfulGuide.showInLongBreak` | `true` |

---

## 4. 休息窗口管理

### 4.1 多显示器覆盖

`OverlayManager` 在每个显示器上创建独立的全屏 `BrowserWindow`：

- **主屏** (index=0): `focusable: true`，显示完整交互界面
- **副屏** (index>0): `focusable: false`，显示简单遮罩提示

### 4.2 窗口属性

```
fullscreen: true          // 全屏
frame: false              // 无边框
transparent: true         // 透明背景
alwaysOnTop: true         // 始终置顶 (screen-saver 层级)
skipTaskbar: true         // 不在任务栏显示
resizable: false          // 不可调整大小
closable: false           // 不可关闭
```

### 4.3 URL 参数

休息页面通过 URL Hash 参数接收信息：

```
#/rest?breakType=mini&duration=20&isPrimary=true&forceMode=stretch
```

| 参数 | 说明 |
|------|------|
| `breakType` | `'mini'` 或 `'long'` |
| `duration` | 休息时长（秒） |
| `isPrimary` | 是否主屏 |
| `forceMode` | 强制使用的模式（可选） |

---

## 5. 休息中的交互

### 5.1 跳过按钮

- 延迟显示：由 `skipButtonDelay` 控制（默认 5 秒后出现）
- 严格模式下：不显示跳过按钮
- 点击后：调用 `window.api.break.skip()` → 主进程 `timerManager.skipBreak()`

### 5.2 严格模式（防作弊）

启用后：
- 不显示跳过按钮
- 检测鼠标移动/点击/键盘输入
- 检测到活动时重置休息倒计时

### 5.3 喝水进度

当 `water.enabled` 和 `water.showInBreak` 均为 `true` 时：
- 短休息：显示精简喝水进度条
- 长休息：显示完整喝水进度环 + 快捷记录按钮

### 5.4 健康提示卡片

当 `mindfulness.healthTips.enabled` 为 `true` 时，经典模式会显示随机健康知识卡片。

---

## 6. 休息结束与统计

### 6.1 自动结束

倒计时到 0 → `completeBreak()` → 记录到数据库 → 重置倒计时 → 恢复工作状态

### 6.2 手动跳过

用户点击跳过 → `skipBreak()` → 记录为 `'skipped'` → 重置倒计时

### 6.3 数据库记录

每次休息结束后写入 `break_records` 表：

| 字段 | 说明 |
|------|------|
| `breakType` | `'mini'` 或 `'long'` |
| `startedAt` | 开始时间 |
| `endedAt` | 结束时间 |
| `plannedDuration` | 计划时长 |
| `actualDuration` | 实际时长 |
| `status` | `'completed'` / `'skipped'` / `'interrupted'` |

### 6.4 倒计时重置规则

| 完成类型 | Mini Break 重置 | Long Break 重置 |
|---------|----------------|-----------------|
| Mini Break 完成/跳过 | 重置 Mini 倒计时 | 不影响 |
| Long Break 完成/跳过 | 重置 Mini 倒计时 | 重置 Long 倒计时 |

---

## 7. 暂停与恢复

### 7.1 暂停源

| 暂停源 | 触发条件 | 说明 |
|--------|---------|------|
| `manual` | 用户手动暂停 | 托盘/快捷键/统计页 |
| `idle` | 空闲检测 | 空闲时间超过阈值 |
| `suspend` | 系统休眠 | `powerMonitor.suspend` |
| `lock-screen` | 锁屏 | `powerMonitor.lock-screen` |
| `dnd` | 免打扰模式 | 系统免打扰开启 |
| `fullscreen` | 全屏应用 | 检测到全屏应用 |
| `schedule` | 非工作时段 | 不在工作时间范围内 |

### 7.2 暂停联动

手动暂停（`manual`）时，同步暂停以下独立提醒模块：
- 喝水提醒 (WaterReminder)
- 站立提醒 (StandReminder)
- 久坐检测 (SedentaryDetector)
- 下班提醒 (WorkEndReminder)

恢复时同步重新启动上述模块。

### 7.3 多暂停源机制

使用 `Set<PauseSource>` 追踪所有活跃暂停源，**只有所有暂停源都解除后**才恢复运行。

---

## 8. 通知方式

| 模式 | 预告通知 | 休息覆盖窗口 | 休息通知 |
|------|---------|-------------|---------|
| `overlay` | 无 | 显示 | 无 |
| `notification` | 30秒预告 | 不显示 | 发送通知 |
| `both` | 30秒预告 | 显示 | 发送通知 |

---

## 9. 拉伸引导模式详解

### 9.1 动作数据

内置 10 种办公室拉伸动作，涵盖：颈部、肩部、腰部、手腕、手指、腿部、小腿。

每个动作包含：
- 名称、目标部位、建议时长
- 分步骤说明
- 注意事项

### 9.2 步骤自动计时

每个步骤设有固定倒计时，倒计时结束自动标记完成并进入下一步。全部步骤完成后自动切换到下一个动作。

### 9.3 教学视频

拉伸模式支持内嵌教学视频，按动作部位分类，来源包括 B站和 YouTube。

### 9.4 动作切换

- 每 30 秒自动切换到下一个动作
- 支持手动点击「下一个动作」
- 完成的动作会记录到运动统计

---

## 10. 各模式效果一览

| 模式 | 背景 | 核心交互 | 附加功能 |
|------|------|---------|---------|
| 经典 | 半透明黑 + 渐变装饰 | 进度环倒计时 | 运动视频/喝水/健康提示 |
| 自然风光 | 高清风景照轮播 | 沉浸式观看 | 喝水进度 |
| 呼吸引导 | 深色渐变 | 呼吸圆环动画 | - |
| 眼部训练 | 深色 | 追踪引导动画 | - |
| 纯黑暗屏 | 纯黑 | 极简倒计时 | - |
| 拉伸引导 | 护眼绿+自然风景 | 步骤自动计时+视频 | 喝水进度 |
| 正念引导 | 紫色渐变 | 正念步骤引导 | 喝水进度/健康提示 |

---

**最后更新**: 2026-02-25
