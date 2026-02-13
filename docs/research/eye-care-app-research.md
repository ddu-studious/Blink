# 青眸 (QingMou) 护眼桌面应用 - 技术调研

**版本**: v1.0  
**创建日期**: 2026-02-13  
**状态**: 已完成

---

## 1. 调研背景

### 1.1 项目背景

长时间使用电脑工作已成为现代人的日常，由此引发的视觉疲劳综合症（Computer Vision Syndrome, CVS）日益严重。据美国眼科学会统计，超过 50% 的电脑用户存在不同程度的视觉疲劳问题。科学研究表明，**20-20-20 法则**（每 20 分钟看向 20 英尺外远眺 20 秒）能有效缓解眼部疲劳。

本项目旨在构建一个**跨平台护眼桌面应用「青眸 / QingMou」**，通过智能定时提醒、强制休息机制和使用统计等功能，帮助用户养成健康的用眼习惯。

### 1.2 调研目标

1. 分析现有护眼/休息提醒应用的功能特性和技术方案
2. 对比主流跨平台桌面框架（Electron / Tauri / Flutter 等）的技术选型
3. 调研核心技术实现方案（系统托盘、空闲检测、多屏覆盖等）
4. 确定推荐技术栈和开发路线

---

## 2. 竞品分析

### 2.1 主要竞品概览

| 竞品 | 技术栈 | Stars | 平台 | 状态 | 许可证 |
|------|-------|-------|------|------|--------|
| **Stretchly** | Electron + JavaScript | 5,694 | Win/Mac/Linux | 活跃维护 (v1.20.0) | BSD-2 |
| **Blink Eye** | Tauri + React + TypeScript | 236 | Win/Mac/Linux | 活跃维护 (v2.7.4) | GPL-3.0 |
| **eyePause** | Electron + JavaScript | 3 | Win/Mac/Linux | 低活跃 | MIT |
| **break-reminder** | Tauri + Rust | - | Win/Mac/Linux | 活跃开发 | - |

### 2.2 Stretchly 深度分析

**项目地址**: https://github.com/hovancik/stretchly

Stretchly 是该领域最成熟的开源项目，自 2016 年持续维护至今，为本项目提供了极好的参考。

#### 核心功能

| 功能 | 说明 |
|------|------|
| 双级休息机制 | Mini Break（短休息，默认 20 秒/10 分钟）+ Long Break（长休息，默认 5 分钟/30 分钟） |
| 系统托盘 | 常驻系统托盘，右键菜单操作 |
| 空闲检测 | 使用 `node-desktop-idle-v2` 检测用户空闲状态，空闲超过阈值自动暂停计时 |
| 全屏遮罩 | 休息时全屏覆盖，`alwaysOnTop` 确保置顶 |
| 免打扰模式 | 检测系统免打扰/勿扰模式，自动暂停提醒 |
| 自启动 | 使用 `auto-launch` 实现开机自启 |
| 国际化 | 使用 `i18next` 支持多语言 |
| 偏好设置 | 使用 `electron-store` 持久化用户设置 |
| 日志 | 使用 `electron-log` 记录运行日志 |
| 声音提示 | 休息开始/结束时播放提示音 |
| 跳过功能 | 允许用户跳过当前休息 |
| 自定义主题 | 支持亮色/暗色主题 |
| 应用排除 | 检测特定应用（如全屏演示）时自动暂停 |

#### 技术栈详解

```json
{
  "运行时": "Electron 40.x (Chromium + Node.js)",
  "语言": "JavaScript (ES Module)",
  "打包工具": "electron-builder 26.x",
  "测试框架": "Vitest 4.x",
  "空闲检测": "node-desktop-idle-v2",
  "数据持久化": "electron-store 11.x",
  "日志": "electron-log 5.x",
  "自启动": "auto-launch 6.x",
  "国际化": "i18next + i18next-fs-backend",
  "时间处理": "Luxon 3.x",
  "免打扰检测": "windows-focus-assist (Win) / macos-notification-state (Mac)"
}
```

#### 架构亮点

- **LSBackgroundOnly / LSUIElement**: macOS 配置为后台应用，不显示在 Dock 栏
- **双级中断机制**: Mini Break + Long Break 灵活搭配
- **原生空闲检测**: 依赖原生模块 `node-desktop-idle-v2`，比 `powerMonitor.getSystemIdleTime()` 更精确
- **多平台免打扰集成**: 分别对接 Windows Focus Assist 和 macOS Notification State

#### 不足之处

- JavaScript 无类型系统，维护成本较高
- UI 较为简单朴素，用户体验有提升空间
- 无使用统计/数据可视化功能
- 包体积较大（Electron 的通病，约 150MB+）

### 2.3 Blink Eye 深度分析

**项目地址**: https://github.com/nomandhoni-cs/blink-eye

Blink Eye 是近两年崛起的新秀，使用 Tauri 框架，在轻量化方面有优势。

#### 核心功能

| 功能 | 说明 |
|------|------|
| 20-20-20 法则 | 可自定义的定时提醒 |
| 全屏休息 | 全屏倒计时页面 |
| 屏幕时间追踪 | 每日/每周/累计使用时间统计 |
| 任务管理 | 内建简易任务管理器 |
| 番茄钟 | 集成 Pomodoro 计时器 |
| 自定义主题 | 多种主题和自定义背景 |
| 声音提示 | 自定义提醒声音和文字 |
| 统计图表 | 使用 Recharts 可视化统计数据 |

#### 技术栈详解

```json
{
  "框架": "Tauri 2.x (Rust 后端 + WebView 前端)",
  "前端": "React 18 + TypeScript + Vite 5",
  "UI": "Radix UI + Tailwind CSS + Framer Motion",
  "图表": "Recharts 2.x",
  "路由": "React Router 6.x",
  "数据": "@tauri-apps/plugin-store (本地存储) + plugin-sql (SQLite)",
  "通知": "@tauri-apps/plugin-notification",
  "自启动": "@tauri-apps/plugin-autostart",
  "自动更新": "@tauri-apps/plugin-updater"
}
```

#### 架构亮点

- **极小包体积**: Tauri 使用系统 WebView，包体积仅 ~10MB（vs Electron ~150MB）
- **低内存占用**: 比 Electron 低约 58%
- **现代前端栈**: React + TypeScript + Tailwind + Radix UI
- **丰富的统计功能**: 屏幕时间追踪和可视化
- **SQLite 数据库**: 使用 plugin-sql 存储统计数据

#### 不足之处

- Tauri 生态相对不成熟，第三方库少
- Rust 后端学习曲线陡峭（如果需要修改底层功能）
- WebView 在不同系统上渲染差异（Windows WebView2 vs macOS WKWebView vs Linux WebKitGTK）
- 部分系统级 API（空闲检测、免打扰模式检测）支持不如 Electron 完善

### 2.4 竞品功能矩阵对比

| 功能维度 | Stretchly | Blink Eye | 青眸 (目标) |
|---------|-----------|-----------|------------|
| 定时提醒 | 双级 (Mini + Long) | 单级可调 | 双级 + 自定义 |
| 全屏覆盖 | 基础覆盖 | 美观覆盖 | 动画过渡 + 多屏 |
| 空闲检测 | 原生模块 | 基础 | 原生模块 |
| 免打扰感知 | Win + Mac | 无 | Win + Mac |
| 系统托盘 | 完善 | 基础 | 完善 + 倒计时 |
| 使用统计 | 无 | 基础 | 详细 + 可视化 |
| 国际化 | 多语言 | 英文 | 中/英文 |
| 自动更新 | 无 | Tauri 内建 | electron-updater |
| 自启动 | auto-launch | Tauri 插件 | auto-launch |
| 主题切换 | 亮/暗 | 多主题 | 亮/暗 + 自定义 |
| 防作弊 | 无 | 无 | 鼠标/键盘监测 |
| 多屏支持 | 基础 | 无 | 全覆盖 |
| 番茄钟 | 无 | 集成 | 集成 |
| 护眼小知识 | 休息时展示 | 无 | 休息时展示 |

---

## 3. 技术框架选型

### 3.1 候选框架对比

#### 方案 A: Electron

| 维度 | 详情 |
|------|------|
| **简介** | 基于 Chromium + Node.js 的跨平台桌面框架 |
| **语言** | JavaScript / TypeScript |
| **包体积** | ~150MB (内嵌完整 Chromium) |
| **内存占用** | ~100-200MB |
| **生态成熟度** | 极高 (npm 生态直接使用) |
| **学习曲线** | 低 (Web 开发者无门槛) |
| **系统 API** | 丰富 (Tray, powerMonitor, screen, Notification, globalShortcut) |
| **渲染一致性** | 跨平台完全一致 (内嵌 Chromium) |
| **代表应用** | VS Code, Slack, Discord, Notion, Stretchly |
| **打包工具** | electron-builder / Electron Forge |

**优势**:
- 你已熟悉 Node.js，上手零门槛
- npm 生态极其丰富，所需功能几乎都有现成方案
- 系统级 API 最完善（空闲检测、免打扰模式、多屏管理）
- 社区成熟，遇到问题容易找到解决方案
- 渲染一致性最好，无跨平台 UI 差异

**劣势**:
- 包体积大（~150MB）
- 内存占用较高
- 安全性需要注意（IPC 通信和 contextIsolation）

#### 方案 B: Tauri

| 维度 | 详情 |
|------|------|
| **简介** | 基于 Rust + 系统 WebView 的跨平台桌面框架 |
| **语言** | Rust (后端) + JS/TS (前端) |
| **包体积** | ~5-10MB |
| **内存占用** | ~50-80MB |
| **生态成熟度** | 中等 (Tauri 2.x 刚稳定) |
| **学习曲线** | 中高 (Rust 后端需学习) |
| **系统 API** | 中等 (通过插件系统扩展) |
| **渲染一致性** | 中等 (依赖系统 WebView，有平台差异) |
| **代表应用** | Blink Eye, Pake, Clash Verge |
| **打包工具** | tauri-cli 内建 |

**优势**:
- 包体积极小（~10MB vs Electron ~150MB）
- 内存占用低（~58% less）
- Rust 后端性能优秀
- 安全模型更好（权限系统）

**劣势**:
- Rust 学习曲线陡峭
- 系统 WebView 渲染有平台差异（尤其 Linux WebKitGTK）
- 空闲检测等系统级功能需要自行用 Rust 实现或找第三方 crate
- 生态不够成熟，部分功能需要自己造轮子
- 调试体验不如 Electron（Chromium DevTools）

#### 方案 C: Flutter Desktop

| 维度 | 详情 |
|------|------|
| **简介** | Google 的跨平台 UI 框架 (移动 + 桌面) |
| **语言** | Dart |
| **包体积** | ~30-50MB |
| **内存占用** | ~80-120MB |
| **生态成熟度** | 中等 (桌面端相对较新) |
| **学习曲线** | 中等 (Dart 语言 + Flutter Widget 体系) |
| **系统 API** | 需要 FFI/平台通道调用原生 API |
| **渲染一致性** | 高 (自绘引擎 Skia/Impeller) |
| **代表应用** | Ente, AppFlowy |
| **打包工具** | flutter build |

**优势**:
- 自绘引擎，UI 一致性好
- 包体积和内存居中
- 可同时开发移动端

**劣势**:
- Dart 语言需要学习
- 桌面端生态不如移动端成熟
- 系统托盘、空闲检测等功能需要第三方插件或 FFI
- 社区资源较少（桌面端场景）

### 3.2 框架选型推荐

#### 推荐排序：Electron > Tauri > Flutter Desktop

| 评估维度 | 权重 | Electron | Tauri | Flutter |
|---------|------|----------|-------|---------|
| 开发者熟悉度 | 25% | 10 | 5 | 3 |
| 系统 API 完整度 | 20% | 10 | 7 | 5 |
| 生态成熟度 | 20% | 10 | 7 | 6 |
| 包体积/性能 | 15% | 4 | 10 | 7 |
| UI 表现力 | 10% | 9 | 8 | 9 |
| 维护成本 | 10% | 8 | 6 | 5 |
| **加权总分** | 100% | **8.55** | **7.00** | **5.35** |

**推荐选择 Electron**，理由：
1. **开发效率优先**: 你熟悉 Node.js，Electron 零门槛上手
2. **功能完整性**: 护眼应用需要大量系统级 API（空闲检测、多屏管理、免打扰感知），Electron 最完善
3. **生态成熟**: 所有核心功能都有经过生产验证的 npm 包
4. **参考丰富**: Stretchly 作为同类标杆项目可直接参考架构设计
5. **包体积可接受**: 对于桌面应用 150MB 包体积在用户可接受范围内

**如果你特别在意包体积和性能，Tauri 是第二选择**，但需要额外投入学习 Rust。

---

## 4. 核心技术方案

### 4.1 开发工具链

#### 方案 A: electron-vite (推荐)

```
electron-vite + React 18 + TypeScript + Tailwind CSS
```

| 组件 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 构建工具 | electron-vite | latest | 基于 Vite，热重载极快 |
| 前端框架 | React | 18.x | 组件化 UI，生态丰富 |
| 类型系统 | TypeScript | 5.x | 类型安全，提升可维护性 |
| CSS 方案 | Tailwind CSS | 3.x | 原子化 CSS，快速开发 |
| UI 组件库 | Shadcn/ui + Radix UI | latest | 高质量无头组件 |
| 状态管理 | Zustand | 4.x | 轻量级状态管理 |
| 图表 | Recharts | 2.x | 统计数据可视化 |
| 动画 | Framer Motion | 11.x | 流畅过渡动画 |

#### 方案 B: electron-vite + Vue 3

```
electron-vite + Vue 3 + TypeScript + Tailwind CSS
```

| 组件 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 构建工具 | electron-vite | latest | 同上 |
| 前端框架 | Vue | 3.x | 模板语法更直观 |
| 类型系统 | TypeScript | 5.x | 类型安全 |
| CSS 方案 | Tailwind CSS | 3.x | 同上 |
| UI 组件库 | Naive UI / Element Plus | latest | Vue 生态组件库 |
| 状态管理 | Pinia | 2.x | Vue 官方状态管理 |

#### 方案 C: 原生 JavaScript (参考 Stretchly)

```
纯 JavaScript + electron-builder + HTML/CSS
```

| 组件 | 技术 | 说明 |
|------|------|------|
| 语言 | JavaScript (ES Module) | 无编译步骤 |
| 打包 | electron-builder | 成熟稳定 |
| UI | 纯 HTML/CSS | 最轻量 |

**推荐方案 A**: React + TypeScript + Tailwind 是目前前端主流技术栈，适合长期维护。

### 4.2 打包工具选型

| 维度 | electron-builder | Electron Forge |
|------|-----------------|----------------|
| 周下载量 | 579,706 | 190,745 |
| GitHub Stars | 14,397 | - |
| 定制能力 | 极强 | 中等 |
| 上手难度 | 中等 | 简单 |
| 更新频率 | 平均 4 天 | 中等 |
| 适用场景 | 复杂项目、精细控制 | 简单项目、快速上手 |

**推荐 electron-builder**: 社区更大，定制能力更强，Stretchly 也使用它。

### 4.3 核心功能实现方案

#### 4.3.1 系统托盘

```typescript
// Electron Tray API
import { Tray, Menu, nativeImage } from 'electron';

const tray = new Tray(nativeImage.createFromPath('icon.png'));
const contextMenu = Menu.buildFromTemplate([
  { label: '开始护眼', click: () => startTimer() },
  { label: '暂停', click: () => pauseTimer() },
  { type: 'separator' },
  { label: '设置', click: () => showSettings() },
  { label: '退出', role: 'quit' }
]);
tray.setContextMenu(contextMenu);
tray.setToolTip('青眸 - 距下次休息还有 15:30');
```

**macOS 注意**: 设置 `LSUIElement: 1` 让应用不显示在 Dock 栏。

#### 4.3.2 空闲检测

**方案 A**: Electron 内建 API
```typescript
import { powerMonitor } from 'electron';

// 获取系统空闲时间 (秒)
const idleTime = powerMonitor.getSystemIdleTime();

// 获取空闲状态
const idleState = powerMonitor.getSystemIdleState(300); // 300 秒阈值
// 返回: 'active' | 'idle' | 'locked' | 'unknown'
```

**方案 B**: 原生模块 `node-desktop-idle-v2` (更精确)
```typescript
import desktopIdle from 'node-desktop-idle-v2';

// 获取空闲时间 (秒)
const idleTime = desktopIdle.getIdleTime();
```

**推荐方案 A** (内建 API) 作为起步，后续如需更精确可切换到方案 B。

#### 4.3.3 电源管理事件

```typescript
import { powerMonitor } from 'electron';

// 休眠/唤醒
powerMonitor.on('suspend', () => pauseTimer());
powerMonitor.on('resume', () => resumeTimer());

// 锁屏/解锁
powerMonitor.on('lock-screen', () => pauseTimer());
powerMonitor.on('unlock-screen', () => resumeTimer());

// 电源切换 (笔记本)
powerMonitor.on('on-battery', () => { /* 可选: 延长提醒间隔 */ });
powerMonitor.on('on-ac', () => { /* 恢复默认间隔 */ });
```

#### 4.3.4 全屏休息遮罩 (支持多屏)

```typescript
import { BrowserWindow, screen } from 'electron';

function showRestOverlay() {
  const displays = screen.getAllDisplays();
  
  const overlayWindows = displays.map(display => {
    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      fullscreen: true,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        sandbox: true
      }
    });
    
    win.setAlwaysOnTop(true, 'screen-saver');
    win.loadFile('rest.html');
    return win;
  });
  
  return overlayWindows;
}
```

**关键点**:
- `screen.getAllDisplays()` 获取所有屏幕
- 每个屏幕创建独立的 `BrowserWindow`
- `alwaysOnTop` 设为 `screen-saver` 级别确保置顶
- `skipTaskbar: true` 不显示在任务栏

#### 4.3.5 数据持久化

```typescript
// electron-store 用于用户设置
import Store from 'electron-store';

const settingsStore = new Store({
  name: 'settings',
  defaults: {
    miniBreakInterval: 20, // 分钟
    miniBreakDuration: 20, // 秒
    longBreakInterval: 60, // 分钟
    longBreakDuration: 300, // 秒 (5分钟)
    enableSound: true,
    enableIdleDetection: true,
    theme: 'system', // 'light' | 'dark' | 'system'
    language: 'zh-CN'
  }
});

// SQLite (better-sqlite3) 用于统计数据
// 记录每次休息的时间、时长、是否跳过等
```

#### 4.3.6 系统通知

```typescript
import { Notification } from 'electron';

function sendBreakNotification() {
  const notification = new Notification({
    title: '青眸提醒',
    body: '该休息了，望向远方 20 秒吧！',
    icon: nativeImage.createFromPath('icon.png'),
    silent: false
  });
  
  notification.on('click', () => {
    showRestOverlay();
  });
  
  notification.show();
}
```

#### 4.3.7 自动更新

```typescript
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

autoUpdater.logger = log;
autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  // 通知用户有新版本
});

autoUpdater.on('update-downloaded', () => {
  // 提示用户重启安装
  autoUpdater.quitAndInstall();
});
```

### 4.4 依赖库选型

| 功能 | 推荐库 | 备选 | 说明 |
|------|-------|------|------|
| 数据存储 (设置) | electron-store | conf | JSON 存储，原子写入 |
| 数据存储 (统计) | better-sqlite3 | lowdb | 结构化统计数据 |
| 日志 | electron-log | winston | Electron 专用日志 |
| 自启动 | auto-launch | electron-store + login-item | 跨平台开机启动 |
| 国际化 | i18next | vue-i18n (Vue方案) | 成熟的 i18n 方案 |
| 自动更新 | electron-updater | electron 内建 | 配合 electron-builder |
| 空闲检测 | powerMonitor (内建) | node-desktop-idle-v2 | 系统空闲状态 |
| 免打扰检测 | windows-focus-assist + macos-notification-state | 自行实现 | 系统免打扰状态 |
| 时间处理 | dayjs | luxon, date-fns | 轻量时间库 |
| 图表 | Recharts | Chart.js, ECharts | React 图表库 |
| 动画 | Framer Motion | GSAP, anime.js | React 动画库 |
| 图标 | Lucide React | Heroicons, Phosphor | 开源图标库 |
| 进程管理 | ps-list | find-process | 检测运行中的应用 |

---

## 5. 架构设计建议

### 5.1 进程架构

```
┌─────────────────────────────────────────────┐
│                  Main Process               │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Timer   │  │  Tray    │  │  Power    │  │
│  │ Manager  │  │  Module  │  │  Monitor  │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │              │        │
│  ┌────┴─────┐  ┌────┴─────┐  ┌────┴──────┐  │
│  │ Settings │  │  Overlay │  │  Stats    │  │
│  │  Store   │  │  Manager │  │  Database │  │
│  └──────────┘  └──────────┘  └───────────┘  │
│                                             │
│              ┌──────────┐                   │
│              │   IPC    │                   │
│              │  Bridge  │                   │
│              └────┬─────┘                   │
│                   │                         │
└───────────────────┼─────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐
│ Settings │ │  Rest    │ │  Dashboard   │
│ Window   │ │ Overlay  │ │   Window     │
│(Renderer)│ │(Renderer)│ │ (Renderer)   │
└──────────┘ └──────────┘ └──────────────┘
```

### 5.2 模块职责

| 模块 | 进程 | 职责 |
|------|------|------|
| TimerManager | Main | 核心计时逻辑，管理 Mini/Long Break 周期 |
| TrayModule | Main | 系统托盘图标和菜单 |
| PowerMonitor | Main | 监听休眠/唤醒/锁屏/解锁事件 |
| SettingsStore | Main | 用户偏好持久化 (electron-store) |
| OverlayManager | Main | 创建/管理全屏休息窗口 (支持多屏) |
| StatsDatabase | Main | 统计数据存储和查询 (SQLite) |
| IPC Bridge | Main | 主进程与渲染进程通信枢纽 |
| Settings UI | Renderer | 设置页面 (React) |
| Rest Overlay | Renderer | 休息倒计时页面 (React) |
| Dashboard UI | Renderer | 统计仪表盘 (React + Recharts) |

### 5.3 数据流

```
用户操作 → Tray Menu / Settings UI
                    ↓ (IPC)
             Main Process
          ┌─────────────────┐
          │  TimerManager    │ ← powerMonitor (休眠/锁屏)
          │  ↕ 时钟滴答      │ ← idleDetection (空闲状态)
          │  ↕ 状态管理      │
          └────────┬────────┘
                   │
          ┌────────┴────────┐
          │                 │
    时间到了?           记录统计
          │                 │
    ┌─────▼──────┐   ┌─────▼──────┐
    │ 创建休息窗口 │   │ StatsDB    │
    │ (多屏覆盖)  │   │ (SQLite)   │
    └─────┬──────┘   └────────────┘
          │
    ┌─────▼──────┐
    │ Rest Page  │ → 倒计时 → 自动关闭 → 下一轮计时
    │ (Renderer) │
    └────────────┘
```

---

## 6. 关键场景与挑战

### 6.1 场景分析

| 场景 | 挑战 | 解决方案 |
|------|------|---------|
| 电脑休眠后唤醒 | 定时器可能漂移 | `powerMonitor.on('resume')` 重新校准 |
| 用户锁屏 | 不应在锁屏时弹窗 | `powerMonitor.on('lock-screen')` 暂停 |
| 用户长时间空闲 | 不应累计空闲时间 | 定期检查 `getSystemIdleTime()`，超过阈值暂停计时 |
| 全屏演示/游戏 | 不应打断用户 | 检测全屏应用状态 + 免打扰模式 |
| 多显示器 | 需覆盖所有屏幕 | `screen.getAllDisplays()` + 为每个屏幕创建窗口 |
| 用户外接/断开显示器 | 覆盖窗口需动态调整 | `screen.on('display-added/removed')` 事件 |
| 应用意外崩溃 | 计时状态丢失 | 定期持久化状态到 electron-store |
| 开机自启动 | 不同系统行为不同 | auto-launch 库处理跨平台差异 |
| 防作弊 (强制休息) | 用户可能切换窗口 | 监测鼠标/键盘活动，活动则重置倒计时 |
| macOS 权限 | 辅助功能权限 | 引导用户授予必要权限 |

### 6.2 性能考量

| 关注点 | 目标 | 策略 |
|--------|------|------|
| 内存占用 | < 100MB (空闲时) | 按需创建窗口，空闲时只保留托盘 |
| CPU 使用 | < 1% (空闲时) | 避免高频定时器，使用秒级 setInterval |
| 启动速度 | < 2 秒 | V8 bytecode 编译 + 延迟加载 |
| 电池影响 | 可忽略 | 监听电源状态，电池模式降低频率 |

---

## 7. 推荐技术栈总结

### 7.1 最终推荐方案

```
┌───────────────────────────────────────┐
│           青眸 (QingMou) v1.0         │
├───────────────────────────────────────┤
│ 框架:     Electron (latest)           │
│ 构建:     electron-vite               │
│ 前端:     React 18 + TypeScript 5     │
│ 样式:     Tailwind CSS 3 + Shadcn/ui  │
│ 状态:     Zustand                     │
│ 动画:     Framer Motion               │
│ 图表:     Recharts                    │
│ 图标:     Lucide React                │
│ 存储:     electron-store + SQLite     │
│ 日志:     electron-log                │
│ 国际化:   i18next                     │
│ 打包:     electron-builder            │
│ 更新:     electron-updater            │
│ 自启动:   auto-launch                 │
│ 测试:     Vitest + Playwright         │
│ 代码规范: ESLint + Prettier           │
└───────────────────────────────────────┘
```

### 7.2 可替换组件

如果你更熟悉 Vue 生态：

| React 方案 | Vue 替代方案 |
|-----------|-------------|
| React 18 | Vue 3 |
| Shadcn/ui + Radix | Naive UI / Element Plus |
| Zustand | Pinia |
| React Router | Vue Router |
| Recharts | ECharts (vue-echarts) |
| Framer Motion | VueUse Motion / GSAP |
| i18next | vue-i18n |

---

## 8. 参考资源

### 8.1 开源项目

| 项目 | 地址 | 参考价值 |
|------|------|---------|
| Stretchly | https://github.com/hovancik/stretchly | 架构设计、空闲检测、免打扰模式 |
| Blink Eye | https://github.com/nomandhoni-cs/blink-eye | UI 设计、统计功能、Tauri 方案参考 |
| eyePause | https://github.com/richardso21/eyePause | Electron 基础实现参考 |

### 8.2 官方文档

| 文档 | 地址 |
|------|------|
| Electron 官方文档 | https://www.electronjs.org/docs/latest/ |
| electron-vite | https://electron-vite.org/ |
| Tailwind CSS | https://tailwindcss.com/docs |
| Shadcn/ui | https://ui.shadcn.com/ |
| Recharts | https://recharts.org/ |

### 8.3 关键 Electron API

| API | 用途 |
|-----|------|
| `Tray` | 系统托盘 |
| `BrowserWindow` | 窗口管理 |
| `powerMonitor` | 电源/空闲监测 |
| `screen` | 多屏管理 |
| `Notification` | 系统通知 |
| `globalShortcut` | 全局快捷键 |
| `nativeTheme` | 主题切换 |
| `app.getPath('userData')` | 用户数据目录 |

---

**文档版本**: 1.0  
**创建时间**: 2026-02-13  
**维护者**: QingMou Team
