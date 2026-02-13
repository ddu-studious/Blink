# QingMou (青眸) 项目上下文

## 项目信息

- **项目名称**: QingMou / 青眸 (护眼桌面应用)
- **版本**: v1.0.0
- **定位**: 跨平台智能护眼提醒桌面应用

## 技术栈

### 核心框架
- Electron (latest LTS) - 跨平台桌面框架
- electron-vite - 基于 Vite 的 Electron 构建工具
- React 18 + TypeScript 5 - 渲染进程 UI
- Tailwind CSS 3 + Shadcn/ui - 样式和组件

### 状态管理与数据
- Zustand - 渲染进程状态管理
- electron-store - 用户设置持久化 (JSON)
- better-sqlite3 - 统计数据存储 (SQLite)
- dayjs - 时间处理

### 功能依赖
- electron-log - 应用日志
- auto-launch - 开机自启动
- i18next - 国际化 (中/英)
- electron-updater - 自动更新
- Recharts - 统计图表
- Framer Motion - UI 动画
- Lucide React - 图标库

### Electron 核心 API
- `Tray` - 系统托盘
- `BrowserWindow` - 窗口管理 (含全屏覆盖)
- `powerMonitor` - 休眠/唤醒/锁屏/空闲检测
- `screen` - 多显示器管理
- `Notification` - 系统通知
- `globalShortcut` - 全局快捷键
- `nativeTheme` - 主题切换
- `ipcMain/ipcRenderer` - 进程间通信

### 打包与开发
- electron-builder - 跨平台打包
- Vitest - 单元测试
- Playwright - E2E 测试
- ESLint + Prettier - 代码规范
- Husky + lint-staged - Git Hooks

## 核心功能

1. **双级休息提醒**: Mini Break (20秒/20分钟) + Long Break (5分钟/60分钟)
2. **全屏休息覆盖**: 美观半透明遮罩 + 倒计时 + 多屏支持
3. **智能场景感知**: 空闲检测 / 休眠感知 / 锁屏感知 / 免打扰模式
4. **系统托盘常驻**: 右键菜单操作 + 倒计时进度显示
5. **使用统计**: 每日/每周休息次数、时长、达成率可视化
6. **声音提示**: 休息开始/结束时播放提示音
7. **国际化**: 中文/英文双语支持
8. **开机自启动**: 跨平台开机启动
9. **番茄钟**: 集成 Pomodoro 计时器 (进阶)
10. **防作弊模式**: 强制休息期间检测鼠标/键盘活动 (进阶)

## 常用命令

```bash
# === 开发环境 ===

# 安装依赖
npm install

# 启动开发模式 (electron-vite dev)
npm run dev

# 仅启动渲染进程 (不启动 Electron)
npm run dev:renderer

# === 构建与打包 ===

# 构建项目
npm run build

# 打包 macOS
npm run build:mac

# 打包 Windows
npm run build:win

# 打包 Linux
npm run build:linux

# 打包全平台
npm run build:all

# === 测试 ===

# 运行单元测试
npm run test

# 运行单元测试 (监听模式)
npm run test:watch

# 运行 E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage

# === 代码质量 ===

# Lint 检查
npm run lint

# Lint 自动修复
npm run lint:fix

# 代码格式化
npm run format

# 类型检查
npm run typecheck
```

## 关键文件路径

### 主进程
- 入口: `src/main/index.ts`
- 计时器: `src/main/timer/TimerManager.ts`
- 系统托盘: `src/main/tray/TrayManager.ts`
- 覆盖窗口: `src/main/window/OverlayManager.ts`
- 电源监控: `src/main/monitor/PowerMonitor.ts`
- 空闲检测: `src/main/monitor/IdleDetector.ts`
- 设置存储: `src/main/store/SettingsStore.ts`
- 统计数据库: `src/main/store/StatsDatabase.ts`
- IPC 处理器: `src/main/ipc/ipcHandlers.ts`

### 预加载脚本
- 安全桥接: `src/preload/index.ts`

### 渲染进程
- React 入口: `src/renderer/src/main.tsx`
- 休息页面: `src/renderer/src/pages/Rest/`
- 设置页面: `src/renderer/src/pages/Settings/`
- 统计页面: `src/renderer/src/pages/Dashboard/`
- 欢迎页面: `src/renderer/src/pages/Welcome/`
- 通用组件: `src/renderer/src/components/`
- Zustand 状态: `src/renderer/src/stores/`
- 国际化: `src/renderer/src/i18n/`
- 样式: `src/renderer/src/styles/globals.css`

### 配置文件
- electron-vite 配置: `electron.vite.config.ts`
- 打包配置: `electron-builder.yml`
- TypeScript 配置: `tsconfig.json` / `tsconfig.node.json` / `tsconfig.web.json`
- Tailwind 配置: `tailwind.config.ts`
- ESLint 配置: `.eslintrc.cjs`
- Prettier 配置: `.prettierrc`

### 资源文件
- 应用图标: `resources/icons/`
- 提示音: `resources/sounds/`
- 图片资源: `resources/images/`

### 文档
- 项目文档: `docs/`
- 调研文档: `docs/research/`
- 需求文档: `docs/requirements/`
- 架构文档: `docs/architecture/`
- 使用指南: `docs/guides/`

## MCP 工具使用

- **Context7**: 查询技术文档 (Electron, React, Tailwind, Shadcn/ui, Recharts)
- **GitHub**: Git 操作、PR 管理、开源项目调研 (Stretchly, Blink Eye)
- **Sequential Thinking**: 复杂架构设计、多方案对比、问题分析
- **Browser**: 技术文档查阅、UI 设计参考、npm 包搜索

## 进程模型

```
Main Process (Node.js 运行时)
├── TimerManager     → 计时核心 (setInterval, 秒级)
├── TrayManager      → 系统托盘 (Tray API)
├── OverlayManager   → 创建全屏 BrowserWindow (每个显示器一个)
├── PowerMonitor     → 休眠/唤醒/锁屏事件
├── IdleDetector     → 空闲时间检测 (powerMonitor.getSystemIdleTime)
├── SettingsStore    → JSON 存储 (electron-store)
├── StatsDatabase    → SQLite (better-sqlite3)
└── IPC Bridge       → contextBridge 安全通信
     ↕
Renderer Process (Chromium)
├── Rest Pages       → 全屏倒计时 (React + Framer Motion)
├── Settings Page    → 偏好设置 (React + Shadcn/ui)
└── Dashboard Page   → 统计图表 (React + Recharts)
```

## 数据存储

### 用户设置 (electron-store → JSON)
```
路径: {userData}/settings.json
内容: 提醒间隔、休息时长、主题、语言、快捷键、智能设置等
```

### 统计数据 (better-sqlite3 → SQLite)
```
路径: {userData}/stats.db
表:
  - break_records: 每次休息记录 (类型/时间/时长/状态)
  - daily_stats: 每日统计汇总 (完成数/跳过数/总休息时长)
```

## 开发规范

- 渲染进程必须启用 `contextIsolation: true` 和 `sandbox: true`
- 所有 IPC 通信通过 `contextBridge` 暴露安全 API
- 文档必须放在 `docs/` 目录
- 使用 TypeScript 严格模式
- React 组件使用函数式组件 + Hooks
- CSS 使用 Tailwind 原子类，避免自定义 CSS
- Git 提交前自动 lint + format (Husky)
- 代码注释使用中文

## 竞品参考

| 项目 | 技术栈 | 参考价值 |
|------|-------|---------|
| Stretchly (5.7k stars) | Electron + JS | 架构设计、空闲检测、免打扰模式 |
| Blink Eye (236 stars) | Tauri + React + TS | UI 设计、统计功能、数据可视化 |

## 依赖版本速查

| 依赖 | 版本 | 用途 |
|------|------|------|
| Electron | latest LTS | 桌面框架 |
| electron-vite | latest | 构建工具 |
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Tailwind CSS | 3.x | CSS 框架 |
| Shadcn/ui | latest | UI 组件 |
| Zustand | 4.x | 状态管理 |
| electron-store | 11.x | 设置存储 |
| better-sqlite3 | latest | 统计数据库 |
| electron-log | 5.x | 日志 |
| auto-launch | 6.x | 自启动 |
| i18next | latest | 国际化 |
| electron-updater | latest | 自动更新 |
| electron-builder | 26.x | 打包 |
| Recharts | 2.x | 图表 |
| Framer Motion | 11.x | 动画 |
| Lucide React | latest | 图标 |
| dayjs | latest | 时间处理 |
| Vitest | latest | 单元测试 |
