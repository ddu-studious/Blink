# MCP 命令快捷方式

## 常用 MCP 工具

```json
{
  "cursor.commands": {
    "doc": "@Context7",
    "git": "@github",
    "thinking": "@sequential-thinking",
    "browser": "@browser"
  }
}
```

## 使用示例

### 查询技术文档 (@Context7)

```
# Electron 核心 API
@doc Electron Tray 系统托盘创建和菜单
@doc Electron BrowserWindow fullscreen overlay 配置
@doc Electron powerMonitor 休眠唤醒锁屏检测
@doc Electron screen getAllDisplays 多显示器
@doc Electron Notification 系统通知
@doc Electron globalShortcut 全局快捷键
@doc Electron nativeTheme 主题切换
@doc Electron ipcMain ipcRenderer 进程通信
@doc Electron contextBridge 安全桥接
@doc Electron app getPath userData
@doc Electron autoUpdater 自动更新

# electron-vite 构建工具
@doc electron-vite 项目配置
@doc electron-vite React TypeScript 模板
@doc electron-vite 热重载配置
@doc electron-vite 预加载脚本配置

# React / 前端
@doc React 18 Hooks useEffect useState useCallback
@doc React Router 路由配置
@doc Zustand 状态管理
@doc Framer Motion 动画 fadeIn fadeOut
@doc Recharts 折线图柱状图饼图

# Tailwind CSS / UI
@doc Tailwind CSS 配置 dark mode
@doc Shadcn/ui 组件安装使用
@doc Shadcn/ui Button Dialog Switch Slider
@doc Radix UI Select Dropdown Tabs

# 数据存储
@doc electron-store 配置和使用
@doc electron-store Schema 验证
@doc electron-store Migration 迁移
@doc better-sqlite3 基础操作
@doc better-sqlite3 创建表查询插入

# 日志与工具
@doc electron-log 配置和使用
@doc auto-launch 开机自启动
@doc i18next React 集成
@doc i18next 多语言切换
@doc dayjs 时间格式化

# 打包发布
@doc electron-builder 配置
@doc electron-builder macOS DMG 打包
@doc electron-builder Windows NSIS 打包
@doc electron-builder Linux AppImage 打包
@doc electron-builder 代码签名
@doc electron-updater 配置
```

### Git 操作 (@github)

```
# 提交代码
@git 提交代码并推送

# 分支管理
@git 创建功能分支 feature-timer
@git 创建功能分支 feature-tray
@git 创建功能分支 feature-overlay
@git 创建功能分支 feature-settings
@git 创建功能分支 feature-stats
@git 合并到主分支

# PR 管理
@git 创建 PR
@git 查看 PR 状态

# 查看历史
@git 查看最近提交
@git 查看文件变更

# 开源调研
@git 搜索 Electron 护眼应用项目
@git 查看 stretchly 仓库最新架构
@git 查看 blink-eye 仓库技术实现
@git 搜索 electron-vite React TypeScript 模板
@git 搜索 Electron 系统托盘最佳实践
```

### 复杂问题分析 (@sequential-thinking)

```
# 架构设计
@thinking 设计主进程计时器架构
@thinking 设计全屏覆盖多屏方案
@thinking 设计 IPC 通信安全方案
@thinking 设计数据持久化方案 (设置 + 统计)
@thinking 设计休息页面交互流程

# 功能实现
@thinking 分析空闲检测最佳实现方案
@thinking 分析免打扰模式检测方案
@thinking 分析多显示器动态插拔处理
@thinking 设计防作弊模式实现
@thinking 设计番茄钟与护眼提醒联动

# 性能优化
@thinking 分析 Electron 内存占用优化策略
@thinking 分析应用启动速度优化方案
@thinking 分析电池模式下的性能优化
@thinking 设计按需创建/销毁窗口策略

# 问题排查
@thinking 排查全屏覆盖在特定系统上失效
@thinking 排查定时器在休眠后漂移问题
@thinking 排查 macOS 权限导致的功能异常
@thinking 分析打包后与开发模式行为不一致

# 方案对比
@thinking 对比 electron-store vs lowdb vs SQLite 选型
@thinking 对比 Zustand vs Jotai vs Redux 选型
@thinking 对比 electron-builder vs Electron Forge 选型
@thinking 对比 Shadcn/ui vs Radix vs Headless UI 选型
```

### 浏览器操作 (@browser)

```
# 技术文档
@browser 打开 Electron 官方文档 https://www.electronjs.org/docs/latest/
@browser 打开 electron-vite 文档 https://electron-vite.org/
@browser 打开 Tailwind CSS 文档 https://tailwindcss.com/docs
@browser 打开 Shadcn/ui 文档 https://ui.shadcn.com/
@browser 打开 Recharts 文档 https://recharts.org/
@browser 打开 Framer Motion 文档 https://www.framer.com/motion/

# 竞品参考
@browser 打开 Stretchly 仓库 https://github.com/hovancik/stretchly
@browser 打开 Blink Eye 仓库 https://github.com/nomandhoni-cs/blink-eye
@browser 打开 Stretchly 官网 https://hovancik.net/stretchly/
@browser 打开 Blink Eye 官网 https://blinkeye.app/

# UI 设计参考
@browser 搜索 Dribbble 护眼应用 UI 设计
@browser 搜索 desktop app break reminder UI design
@browser 搜索 Electron app modern UI examples

# npm 包搜索
@browser 搜索 npmjs electron-store 最新版本
@browser 搜索 npmjs better-sqlite3 最新版本
@browser 搜索 npmjs auto-launch 使用方法
@browser 搜索 npmjs electron-log 配置

# 技术调研
@browser 搜索 Electron 多屏全屏覆盖最佳实践
@browser 搜索 Electron 空闲检测 idle detection
@browser 搜索 Electron 系统托盘 macOS 最佳实践
@browser 搜索 electron-vite React 项目最佳实践 2026
```

## 自动触发场景

AI 会根据上下文自动选择合适的 MCP 工具：

| 场景 | 自动使用工具 |
|-----|-------------|
| 提到"文档"、"怎么用"、"API"、"SDK" | Context7 |
| 提到"提交"、"推送"、"分支"、"PR" | GitHub |
| 复杂问题、多步骤分析、架构设计 | Sequential Thinking |
| 需要浏览器测试验证、搜索调研 | Browser |

## 项目特定查询示例

### Electron API
```
@doc Electron Tray setToolTip setImage
@doc Electron Tray contextMenu 动态更新
@doc Electron BrowserWindow transparent frame false
@doc Electron BrowserWindow setAlwaysOnTop level
@doc Electron powerMonitor getSystemIdleTime
@doc Electron powerMonitor suspend resume lock-screen
@doc Electron screen getAllDisplays display-added display-removed
@doc Electron Notification click close show
@doc Electron globalShortcut register unregister
@doc Electron nativeTheme shouldUseDarkColors themeSource
@doc Electron app dock hide (macOS)
```

### React + TypeScript
```
@doc React useEffect 清理函数
@doc React useCallback useMemo 性能优化
@doc React createContext useContext
@doc React forwardRef useImperativeHandle
@doc TypeScript 工具类型 Partial Pick Omit
@doc TypeScript 泛型约束
```

### Tailwind CSS + Shadcn
```
@doc Tailwind CSS animate-pulse animate-spin
@doc Tailwind CSS backdrop-blur 毛玻璃效果
@doc Tailwind CSS dark mode class strategy
@doc Shadcn/ui 主题配置
@doc Shadcn/ui form 表单组件
```

### electron-builder
```
@doc electron-builder mac 配置 LSUIElement
@doc electron-builder mac universal binary
@doc electron-builder windows nsis 配置
@doc electron-builder linux AppImage snap deb
@doc electron-builder publish GitHub Release
@doc electron-builder afterSign hook 代码签名
```

## 组合使用示例

### 开发新功能

```
# 1. 先查文档了解技术细节
@doc Electron powerMonitor getSystemIdleTime

# 2. 分析实现方案
@thinking 设计空闲检测与计时器联动方案

# 3. 提交代码
@git 提交空闲检测功能代码

# 4. 测试验证
@browser 验证空闲检测功能
```

### 技术调研

```
# 1. 搜索开源方案
@git 搜索 Electron 多屏全屏覆盖实现

# 2. 浏览技术文档
@browser 搜索 Electron multi-monitor overlay best practice

# 3. 查阅官方文档
@doc Electron screen getAllDisplays

# 4. 深入分析
@thinking 设计多屏覆盖完整方案
```

### 问题排查

```
# 1. 分析问题
@thinking 分析全屏覆盖在 macOS 上闪烁的原因

# 2. 查阅文档
@doc Electron BrowserWindow vibrancy titleBarStyle
@doc Electron BrowserWindow setAlwaysOnTop level

# 3. 搜索解决方案
@browser 搜索 Electron fullscreen overlay macOS flicker fix

# 4. 修复并提交
@git 提交 Bug 修复代码
```

### UI 开发

```
# 1. 查阅组件文档
@doc Shadcn/ui Slider Switch Select

# 2. 查阅动画文档
@doc Framer Motion AnimatePresence fade transition

# 3. 搜索设计灵感
@browser 搜索 break reminder app UI design inspiration

# 4. 实现并提交
@git 提交设置页面 UI
```

## 快捷命令总结

| 命令 | 用途 | 示例 |
|-----|------|-----|
| `@doc` | 查询技术文档 | `@doc Electron Tray API` |
| `@git` | Git 操作/GitHub 调研 | `@git 搜索 stretchly 架构` |
| `@thinking` | 复杂问题分析 | `@thinking 设计计时器架构` |
| `@browser` | 浏览器操作/搜索 | `@browser 搜索 Electron 护眼应用` |

---

**最后更新**: 2026-02-13
