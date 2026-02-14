# 🌿 青眸 QingMou

跨平台智能护眼提醒桌面应用，基于 20-20-20 法则保护你的眼睛。

## 环境要求

| 工具 | 最低版本 |
|------|---------|
| Node.js | 20.19+ 或 22.12+ |
| npm | 9+ |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发模式
npm run dev

# 3. 在浏览器打开 Demo 验收页面 (可选)
open demo/index.html
```

启动后：
- **系统托盘**会出现青眸图标（macOS 在屏幕右上角状态栏）
- **设置窗口**会自动弹出（首次启动）
- **计时器**自动开始，20 分钟后触发第一次短休息

## 项目命令

### 日常开发

```bash
npm run dev          # 启动开发模式 (带 HMR 热重载)
npm run build        # 仅构建 (不打包)
npm run format       # 格式化代码
npm run lint         # ESLint 检查
npm run typecheck    # TypeScript 类型检查
```

### 打包发布

```bash
npm run build:mac    # 打包 macOS DMG
npm run build:win    # 打包 Windows NSIS
npm run build:linux  # 打包 Linux AppImage
```

打包产物输出到 `dist/` 目录。

## 项目结构

```
src/
├── main/                          # 主进程 (Node.js)
│   ├── index.ts                   # 入口，模块编排
│   ├── types.ts                   # 类型定义 + IPC 通道 + 默认设置
│   ├── timer/TimerManager.ts      # 核心计时 (20-20-20 + Long Break)
│   ├── tray/TrayManager.ts        # 系统托盘菜单
│   ├── window/
│   │   ├── OverlayManager.ts      # 全屏休息覆盖 (多屏)
│   │   └── WindowManager.ts       # 设置/统计窗口
│   ├── monitor/
│   │   ├── PowerMonitor.ts        # 休眠/锁屏监听
│   │   └── IdleDetector.ts        # 空闲检测
│   ├── store/
│   │   ├── SettingsStore.ts       # 设置持久化 (JSON)
│   │   └── StatsDatabase.ts       # 统计数据库 (SQLite)
│   └── ipc/ipcHandlers.ts         # IPC 处理器
├── preload/
│   ├── index.ts                   # 安全桥接
│   └── index.d.ts                 # API 类型声明
└── renderer/                      # 渲染进程 (React)
    ├── index.html
    └── src/
        ├── main.tsx               # React 入口
        ├── App.tsx                # Hash 路由
        ├── styles/globals.css     # Tailwind 样式
        └── pages/
            ├── Rest/RestPage.tsx       # 休息覆盖页
            ├── Settings/SettingsPage.tsx   # 设置页
            └── Dashboard/DashboardPage.tsx # 统计页
```

## 核心功能

### 1. 双级休息提醒

| 类型 | 默认间隔 | 默认时长 | 说明 |
|------|---------|---------|------|
| Mini Break (短休息) | 20 分钟 | 20 秒 | 望向远方，放松眼部肌肉 |
| Long Break (长休息) | 60 分钟 | 5 分钟 | 站起活动，放松颈肩 |

### 2. 全屏休息覆盖

- 半透明毛玻璃背景
- 进度环 + 倒计时动画
- 随机护眼小知识/活动建议
- 多显示器同时覆盖
- 5 秒后出现跳过按钮

### 3. 智能场景感知

- **空闲检测**: 用户离开电脑后自动暂停计时
- **休眠/锁屏**: 电脑休眠或锁屏时暂停，恢复后继续
- **免打扰感知**: 系统免打扰模式下暂停提醒
- **全屏检测**: 演示/游戏全屏时暂停提醒

### 4. 系统托盘

- 常驻系统状态栏
- 鼠标悬停显示倒计时
- 右键菜单: 开始/暂停/立即休息/设置/统计/退出
- 关闭窗口不退出，保持后台运行

### 5. 统计仪表盘

- 今日休息完成次数
- 总休息时长
- 跳过次数
- 达成率可视化

## 数据存储

所有数据保存在系统应用数据目录：

| 系统 | 路径 |
|------|------|
| macOS | `~/Library/Application Support/qingmou/` |
| Windows | `%APPDATA%/qingmou/` |
| Linux | `~/.config/qingmou/` |

- `settings.json` — 用户设置 (electron-store)
- `stats.db` — 统计数据 (SQLite)

## 验收指南

我们提供了独立的 HTML Demo 页面，用于验收所有 UI 功能。

```bash
# 浏览器打开 Demo 页面
open demo/index.html
```

Demo 页面包含 6 个模块的完整预览和验收要点：

| # | 模块 | 验收方式 |
|---|------|---------|
| 1 | 短休息页面 | Demo 可视化预览 |
| 2 | 长休息页面 | Demo 可视化预览 |
| 3 | 设置页面 | Demo 可视化预览 (Tab 可切换) |
| 4 | 统计仪表盘 | Demo 可视化预览 |
| 5 | 系统托盘 | 需运行 `npm run dev` 在系统中验证 |
| 6 | 后台架构 | 需运行 `npm run dev` 查看终端日志验证 |

### Electron 中验收

```bash
# 启动后观察以下内容:
npm run dev

# 1. 系统托盘：右上角出现图标 → 右键查看菜单
# 2. 设置窗口：首次启动自动弹出
# 3. 等待 20 分钟或通过托盘 "立即休息" 触发短休息
# 4. 观察全屏覆盖效果
# 5. 终端日志：所有模块初始化成功
```

### 重置首次运行状态

如果需要重新触发首次运行引导：

```bash
# macOS
rm ~/Library/Application\ Support/qingmou/settings.json

# Windows
del %APPDATA%\qingmou\settings.json
```

## 技术栈

| 层面 | 技术 |
|------|------|
| 桌面框架 | Electron 40 |
| 构建工具 | electron-vite 5 |
| 前端框架 | React 18 + TypeScript 5 |
| 样式 | Tailwind CSS 3 |
| 数据库 | SQLite (better-sqlite3) |
| 配置存储 | electron-store |
| 日志 | electron-log |
| 打包 | electron-builder 26 |

## 常见问题

### 启动后没有窗口

青眸是托盘应用，主要操作在系统状态栏图标上。首次启动会自动弹出设置窗口，之后可通过托盘右键菜单打开。

### 打包失败: entitlements.mac.plist 错误

确保 `build/` 目录包含 `entitlements.mac.plist` 和 `entitlements.mac.inherit.plist` 文件。

### 打包失败: dmg-builder 404

确保 `.npmrc` 中没有 `electron_mirror` 配置（会干扰 dmg-builder 工具下载）。

### 开发模式下 preload 报错

electron-vite 5.x 输出 `.mjs` 扩展名，确保 preload 引用路径为 `../preload/index.mjs`。
