# B 站视频集成护眼休息页面 - 技术调研

**版本**: v1.0  
**创建日期**: 2026-02-15  
**状态**: 已完成

---

## 1. 调研背景

青眸护眼应用基于 20-20-20 法则，用户每隔一段时间会进入全屏休息模式。当前休息页面以倒计时 + 文字提示为主，希望集成 B 站的眼部运动、肩颈运动视频，让用户在休息时可以跟着做运动，提升休息效果和用户参与度。

---

## 2. B 站视频嵌入可行性

### 2.1 官方外链播放器

B 站提供**官方外链播放器**，专门用于站外嵌入场景。

| 项目 | 说明 |
|------|------|
| **播放器地址** | `https://player.bilibili.com/player.html` |
| **官方文档** | https://player.bilibili.com/ |
| **嵌入方式** | iframe 嵌入 |
| **支持平台** | 任意支持 iframe 的 Web 环境 |

### 2.2 嵌入 URL 格式

**基础格式**（仅需 bvid 即可）：

```
https://player.bilibili.com/player.html?bvid={BV号}
```

**完整参数示例**：

```
https://player.bilibili.com/player.html?bvid=BV1wy4y1p73y&autoplay=1&danmaku=0&muted=0&t=0&p=1
```

### 2.3 官方 QueryString 参数

| 参数名 | 类型 | 必要 | 说明 |
|--------|------|------|------|
| **bvid** | string | ✅ | 视频 BV 号（推荐，替代 aid） |
| **aid** | number | - | 视频 AV 号（与 bvid 二选一） |
| **cid** | number | - | 视频分段 ID（多 P 时可选） |
| **p** | number | - | 多 P 视频集数，从 1 开始 |
| **autoplay** | boolean | - | 自动播放（0/1） |
| **danmaku** | boolean | - | 弹幕（0=关闭，1=开启） |
| **muted** | boolean | - | 静音（0/1） |
| **t** | number | - | 跳转到指定秒数 |
| **poster** | boolean | - | 展示封面 |

**注意**：`bvid` 单独即可使用，无需预先获取 `cid`。B 站播放器会根据 bvid 自动解析。

### 2.4 在 Electron 中嵌入的可行性

| 维度 | 结论 | 说明 |
|------|------|------|
| **技术可行性** | ✅ 可行 | iframe 在 Electron 的 BrowserWindow 中与普通浏览器行为一致 |
| **跨域限制** | ✅ 无问题 | 使用官方 `player.bilibili.com` 域名，B 站已配置允许嵌入 |
| **安全策略** | ⚠️ 需注意 | 需确保 `webPreferences` 中 `webSecurity` 保持默认，不要禁用 |
| **CSP 限制** | ⚠️ 需注意 | 若设置了 Content-Security-Policy，需允许 `player.bilibili.com` 的 frame-src |

**关键点**：
- ❌ 错误：使用 `https://www.bilibili.com/video/BVxxxx` 作为嵌入地址（会触发跨域/防盗链）
- ✅ 正确：使用 `https://player.bilibili.com/player.html?bvid=BVxxxx`

### 2.5 自动播放与音视频策略

Chromium（Electron 基于 Chromium）对自动播放有严格策略：

| 场景 | 行为 |
|------|------|
| **静音 + autoplay** | ✅ 通常可自动播放 |
| **有声音 + autoplay** | ❌ 需用户交互后才能播放 |

**推荐配置**：
- 休息页面默认 `muted=1`，保证自动播放成功
- 提供「开启声音」按钮，用户点击后取消静音（符合浏览器策略）
- 或在主进程启动时添加：`app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required")`（慎用，可能影响其他页面）

---

## 3. 相关运动视频资源

### 3.1 眼部运动 / 眼保健操

| 视频 | BV 号 | 说明 | 时长 | 播放量 |
|------|-------|------|------|--------|
| 0 成本眼肌训练操 | BV1o44y1j7NX | 睫状肌训练，缓解眼部疲劳 | 短 | - |
| 第六套中小学眼保健操 | BV14Y4y1N7PW | 标准眼保健操，完整教学 | ~5 分钟 | 387.9 万 |
| 日本视力恢复操 | 可搜索 | 护眼、预防视力加深 | 短 | - |

### 3.2 肩颈运动 / 办公室拉伸

| 视频 | BV 号 | 说明 | 时长 | 播放量 |
|------|-------|------|------|--------|
| 帕梅拉 8 分钟久坐拉伸 | BV1wy4y1p73y | 改善圆肩驼背、颈前倾、腰酸背痛 | 8 分钟 | 664 万 |
| 帕梅拉 8 分钟天鹅颈直角肩 | BV1MT4y1772p | 肩颈拉伸、淡化颈纹 | 8 分钟 | 681 万 |
| 帕梅拉 8 分钟颈背拉伸 | 可搜索 | 改善驼背、脖颈前伸、富贵包 | 8 分钟 | 1060 万 |
| 帕梅拉 8 分钟每日拉伸 | BV1va411s7YD | 从头到脚，告别僵硬酸痛 | 8 分钟 | - |
| 周六野 10 分钟久坐拉伸 | 可搜索 | 消除斜方肌肿胀，改善驼背 | 10 分钟 | 326 万 |

### 3.3 推荐视频配置（青眸预设）

**Mini Break（20 秒）**：不适合跟练完整视频，建议：
- 仅展示「望向远方」提示 + 倒计时
- 或可选：播放眼部运动视频的**前 20 秒**（如眼保健操开头），作为视觉引导

**Long Break（5 分钟）**：适合跟练视频
- **眼部**：BV14Y4y1N7PW（第六套眼保健操）
- **肩颈**：BV1wy4y1p73y（帕梅拉 8 分钟久坐拉伸，5 分钟可跟练前半段）
- **综合**：BV1va411s7YD（8 分钟每日拉伸）

---

## 4. 技术方案

### 4.1 嵌入方式选择

| 方式 | 推荐度 | 说明 |
|------|--------|------|
| **iframe** | ✅ 推荐 | 与普通浏览器一致，B 站官方支持，无需额外配置 |
| **webview 标签** | ⚠️ 不推荐 | Electron 官方建议弃用，存在架构变化风险 |
| **WebContentsView** | 可选 | 主进程创建，控制力更强，但实现复杂度高 |

**结论**：使用 **iframe** 嵌入 B 站官方播放器即可。

### 4.2 实现示例

```tsx
// BilibiliEmbed.tsx
interface BilibiliEmbedProps {
  bvid: string
  autoplay?: boolean
  muted?: boolean
  danmaku?: boolean
  className?: string
}

export function BilibiliEmbed({
  bvid,
  autoplay = true,
  muted = true,
  danmaku = false,
  className = ''
}: BilibiliEmbedProps) {
  const params = new URLSearchParams({
    bvid,
    autoplay: autoplay ? '1' : '0',
    muted: muted ? '1' : '0',
    danmaku: danmaku ? '1' : '0'
  })
  const src = `https://player.bilibili.com/player.html?${params.toString()}`

  return (
    <iframe
      src={src}
      className={className}
      allowFullScreen
      scrolling="no"
      frameBorder={0}
      sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"
    />
  )
}
```

### 4.3 主进程配置

**自动播放策略**（可选，若默认 muted 则通常不需要）：

```typescript
// main/index.ts
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
```

**CSP 配置**（若使用 CSP）：

```
frame-src https://player.bilibili.com;
```

### 4.4 音视频权限

Electron 的 BrowserWindow 默认支持：
- 视频播放
- 音频播放（需用户交互或 muted 自动播放）

无需额外配置 `webPreferences`，保持默认即可。

---

## 5. 竞品参考

### 5.1 GitHub 护眼应用

| 项目 | Stars | 技术栈 | 运动视频功能 |
|------|-------|--------|--------------|
| **SafeEyes** | 1,662 | Python + GTK | ❌ 无，仅有插件（通知、勿扰、健康统计等） |
| **Blink Eye** | 237 | Tauri + React | ❌ 无，休息页为倒计时 + 提示 |
| **Stretchly** | 5,694 | Electron | ❌ 无，仅有文字/图示拉伸指引 |
| **EyeBreak** | 1 | Python | ❌ 无 |
| **break-reminder** | 0 | JS/TS | ❌ 无 |

**结论**：目前**没有**发现将 B 站或类似平台运动视频集成到护眼休息页面的开源项目。青眸若实现此功能，将具备差异化竞争力。

### 5.2 SafeEyes 插件机制参考

SafeEyes 有插件系统（如 `screensaver`、`audiblealert`、`healthstats` 等），但均不涉及视频嵌入。其休息界面为 GTK 窗口，与 Web 技术栈不同。青眸可参考其「可扩展」思路，将视频源做成可配置项（用户自定义 BV 号）。

---

## 6. UI 布局方案

### 6.1 当前 Rest 页面结构

当前 `RestPage.tsx` 布局：
- 全屏半透明黑色背景 + 模糊
- 中央：标题 → 圆形倒计时 → 提示文字 → 跳过按钮
- 非主屏：仅显示「休息一下」

### 6.2 集成视频后的布局建议

#### 方案 A：上下分栏（推荐 - Long Break）

```
┌─────────────────────────────────────────┐
│           长休息 · 跟练肩颈拉伸           │
├─────────────────────────────────────────┤
│                                         │
│         [ B 站视频 iframe 区域 ]         │
│         比例 16:9，高度约 40-50%         │
│                                         │
├─────────────────────────────────────────┤
│               ⏱ 4:32                   │
│         站起来活动一下身体吧             │
│         💡 做几次肩部环绕运动...         │
│              [ 跳过 ]                   │
└─────────────────────────────────────────┘
```

- 视频在上，倒计时在下
- 视频区域使用 `aspect-ratio: 16/9` 或固定高度，避免挤压
- 倒计时区域保持现有样式

#### 方案 B：左右分栏（宽屏优化）

```
┌──────────────────────────┬──────────────┐
│                          │   长休息     │
│   [ B 站视频 iframe ]     │   ⏱ 4:32    │
│   宽度约 60-70%          │   提示文字   │
│                          │   [ 跳过 ]   │
└──────────────────────────┴──────────────┘
```

- 适合超宽屏
- 视频在左，倒计时在右

#### 方案 C：Mini Break 保持现状

Mini Break 仅 20 秒，不适合跟练完整视频。建议：
- 保持当前「倒计时 + 提示」布局
- 或可选展示「眼保健操」视频前 20 秒作为引导（用户可在设置中开关）

### 6.3 响应式与多屏

| 场景 | 处理 |
|------|------|
| **单屏** | 主屏显示完整内容（视频 + 倒计时） |
| **多屏** | 主屏完整内容，副屏可仅显示「休息中」或同步视频（需评估性能） |
| **小屏/低分辨率** | 视频区域缩小，保证倒计时可见 |
| **竖屏** | 视频在上，倒计时在下，避免横向过窄 |

### 6.4 空间分配建议

| 元素 | 占比 | 说明 |
|------|------|------|
| 视频区域 | 45-55% | 保证 16:9 比例，最小高度 200px |
| 倒计时 | 20-25% | 圆形进度环 + 时间数字 |
| 提示文字 | 10-15% | 1-2 行 |
| 跳过按钮 | 5% | 底部 |
| 边距/留白 | 10-15% | 保持呼吸感 |

---

## 7. 推荐方案总结

### 7.1 技术选型

| 项目 | 选择 |
|------|------|
| 嵌入方式 | iframe |
| 播放器地址 | `https://player.bilibili.com/player.html` |
| 参数 | `bvid` + `autoplay=1` + `muted=1` + `danmaku=0` |
| 音视频 | 默认静音自动播放，可选「开启声音」按钮 |

### 7.2 功能分阶段建议

| 阶段 | 内容 |
|------|------|
| **Phase 1** | Long Break 集成 1-2 个预设视频（眼部 + 肩颈），上下分栏布局 |
| **Phase 2** | 设置页增加「休息时显示视频」开关、视频类型选择（眼部/肩颈/关闭） |
| **Phase 3** | 支持用户自定义 BV 号，或从预设列表多选 |
| **Phase 4** | Mini Break 可选展示短视频片段（如前 20 秒眼保健操） |

### 7.3 预设视频列表（可配置常量）

```typescript
// constants/exerciseVideos.ts
export const EXERCISE_VIDEOS = {
  eye: [
    { bvid: 'BV14Y4y1N7PW', title: '第六套眼保健操', duration: 300 },
    { bvid: 'BV1o44y1j7NX', title: '0成本眼肌训练操', duration: 120 }
  ],
  shoulder: [
    { bvid: 'BV1wy4y1p73y', title: '帕梅拉 8分钟久坐拉伸', duration: 480 },
    { bvid: 'BV1MT4y1772p', title: '帕梅拉 8分钟天鹅颈', duration: 480 },
    { bvid: 'BV1va411s7YD', title: '帕梅拉 8分钟每日拉伸', duration: 480 }
  ]
}
```

### 7.4 风险与注意事项

| 风险 | 缓解措施 |
|------|----------|
| B 站视频下架/失效 | 预设多个备选视频，定期检查；支持用户自定义 BV |
| 版权/合规 | 使用 B 站官方嵌入，不下载、不二次分发，符合其外链政策 |
| 网络依赖 | 无网络时降级为纯倒计时 + 文字提示 |
| 自动播放失败 | 默认 muted，提供「点击播放」fallback |

---

## 8. 参考资源

| 资源 | 链接 |
|------|------|
| B 站外链播放器文档 | https://player.bilibili.com/ |
| B 站 API 合集（获取 cid 等） | https://socialsisteryi.github.io/bilibili-API-collect/ |
| Electron Web Embeds | https://www.electronjs.org/docs/latest/tutorial/web-embeds |
| Chromium 自动播放策略 | https://developer.chrome.com/blog/autoplay/ |

---

**文档版本**: 1.0  
**创建时间**: 2026-02-15  
**维护者**: QingMou Team
