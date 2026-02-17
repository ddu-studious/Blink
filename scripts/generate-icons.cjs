#!/usr/bin/env node
/**
 * 青眸 (QingMou) - 应用图标生成脚本
 *
 * 生成统一的品牌图标:
 * - icon-1024.png (1024x1024 主源文件)
 * - icon.png (512x512)
 * - tray-icon.png (22x22 macOS 托盘)
 * - tray-icon@2x.png (44x44 Retina 托盘)
 * - icon.icns (macOS 应用图标 - 通过 sips/iconutil)
 * - icon.ico (Windows 图标 - 通过 convert)
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ICONS_DIR = path.join(__dirname, '..', 'resources', 'icons')

// 确保目录存在
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true })
}

// ========================================
// 主应用图标 SVG (圆角方形 + 植物叶子)
// ========================================
const APP_ICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 背景渐变 -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a7a4c"/>
      <stop offset="50%" stop-color="#15825a"/>
      <stop offset="100%" stop-color="#0d6b48"/>
    </linearGradient>
    <!-- 叶子渐变 -->
    <linearGradient id="leaf1" x1="0.3" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#7dd3a0"/>
      <stop offset="100%" stop-color="#3db876"/>
    </linearGradient>
    <linearGradient id="leaf2" x1="0.3" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#a8e6c4"/>
      <stop offset="100%" stop-color="#5ec89a"/>
    </linearGradient>
    <linearGradient id="leaf3" x1="0.2" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#5ec89a"/>
      <stop offset="100%" stop-color="#2da06a"/>
    </linearGradient>
  </defs>

  <!-- 圆角方形背景 -->
  <rect width="1024" height="1024" rx="228" ry="228" fill="url(#bg)"/>

  <!-- 微妙内阴影 -->
  <rect width="1024" height="1024" rx="228" ry="228" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>

  <!-- 茎/主干 -->
  <path d="M 512 750 Q 510 600 500 480 Q 490 380 520 300" fill="none" stroke="#2da06a" stroke-width="14" stroke-linecap="round"/>

  <!-- 左下叶子 (大) -->
  <path d="M 500 560 Q 380 510 330 420 Q 310 370 350 330 Q 400 310 440 340 Q 490 400 500 560 Z" fill="url(#leaf1)" opacity="0.95"/>
  <!-- 左叶脉 -->
  <path d="M 495 550 Q 420 490 370 380" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" stroke-linecap="round"/>

  <!-- 右叶子 (中) -->
  <path d="M 510 480 Q 600 400 660 350 Q 700 330 710 370 Q 700 430 640 480 Q 570 530 510 480 Z" fill="url(#leaf2)" opacity="0.9"/>
  <!-- 右叶脉 -->
  <path d="M 515 478 Q 600 420 670 365" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" stroke-linecap="round"/>

  <!-- 顶部叶子 (小) -->
  <path d="M 518 330 Q 490 250 510 200 Q 530 170 555 195 Q 570 240 540 310 Q 530 330 518 330 Z" fill="url(#leaf3)" opacity="0.85"/>

  <!-- 小嫩芽 (右上) -->
  <path d="M 525 360 Q 560 310 590 290 Q 605 285 605 300 Q 595 330 555 360 Q 540 370 525 360 Z" fill="#7dd3a0" opacity="0.75"/>

  <!-- 微光效果 -->
  <circle cx="380" cy="330" r="3" fill="rgba(255,255,255,0.3)"/>
  <circle cx="650" cy="350" r="2" fill="rgba(255,255,255,0.25)"/>
</svg>`

// ========================================
// 托盘图标 SVG (简洁眼睛轮廓, 黑色模板图标)
// macOS 托盘模板图标: 纯黑 + 透明, 系统自动适配暗/亮
// ========================================
const TRAY_ICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
  <!-- 眼睛外轮廓 (杏仁形) -->
  <path d="M 11 6 Q 16.5 6 19 11 Q 16.5 16 11 16 Q 5.5 16 3 11 Q 5.5 6 11 6 Z"
    fill="none" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- 虹膜 -->
  <circle cx="11" cy="11" r="3.5" fill="none" stroke="black" stroke-width="1.2"/>
  <!-- 瞳孔 -->
  <circle cx="11" cy="11" r="1.8" fill="black"/>
  <!-- 高光 -->
  <circle cx="9.8" cy="9.8" r="0.8" fill="white"/>
</svg>`

// ---- 写入 SVG 文件 ----
const svgPath = path.join(ICONS_DIR, 'icon.svg')
fs.writeFileSync(svgPath, APP_ICON_SVG)
console.log('✅ icon.svg 已生成')

const traySvgPath = path.join(ICONS_DIR, 'tray-icon.svg')
fs.writeFileSync(traySvgPath, TRAY_ICON_SVG)
console.log('✅ tray-icon.svg 已生成')

// ---- 使用系统工具转换为 PNG ----
// 需要安装 librsvg 或使用其他 SVG→PNG 转换工具

// 尝试用 rsvg-convert (如果可用)
function tryConvert() {
  const sizes = [
    { name: 'icon-1024.png', size: 1024 },
    { name: 'icon.png', size: 512 },
    { name: 'icon-256.png', size: 256 },
    { name: 'icon-128.png', size: 128 },
    { name: 'icon-64.png', size: 64 },
    { name: 'icon-32.png', size: 32 },
    { name: 'icon-16.png', size: 16 }
  ]

  // 尝试 rsvg-convert
  let converter = null
  try {
    execSync('which rsvg-convert', { stdio: 'pipe' })
    converter = 'rsvg'
  } catch {
    // 尝试 ImageMagick convert
    try {
      execSync('which convert', { stdio: 'pipe' })
      converter = 'imagemagick'
    } catch {
      console.log('⚠️  未找到 rsvg-convert 或 ImageMagick，跳过 PNG 生成')
      console.log('   请手动安装: brew install librsvg 或 brew install imagemagick')
      return false
    }
  }

  console.log(`\n使用 ${converter} 转换 SVG → PNG ...`)

  for (const { name, size } of sizes) {
    const outPath = path.join(ICONS_DIR, name)
    try {
      if (converter === 'rsvg') {
        execSync(`rsvg-convert -w ${size} -h ${size} "${svgPath}" -o "${outPath}"`)
      } else {
        execSync(`convert -background none -resize ${size}x${size} "${svgPath}" "${outPath}"`)
      }
      console.log(`  ✅ ${name} (${size}x${size})`)
    } catch (e) {
      console.log(`  ❌ ${name} 转换失败: ${e.message}`)
    }
  }

  // 托盘图标
  const trayPairs = [
    { name: 'tray-icon.png', size: 22 },
    { name: 'tray-icon@2x.png', size: 44 }
  ]
  for (const { name, size } of trayPairs) {
    const outPath = path.join(ICONS_DIR, name)
    try {
      if (converter === 'rsvg') {
        execSync(`rsvg-convert -w ${size} -h ${size} "${traySvgPath}" -o "${outPath}"`)
      } else {
        execSync(`convert -background none -resize ${size}x${size} "${traySvgPath}" "${outPath}"`)
      }
      console.log(`  ✅ ${name} (${size}x${size})`)
    } catch (e) {
      console.log(`  ❌ ${name} 转换失败: ${e.message}`)
    }
  }

  return true
}

const pngOk = tryConvert()

// ---- 生成 macOS .icns ----
if (pngOk && process.platform === 'darwin') {
  console.log('\n生成 macOS .icns ...')
  const iconsetDir = path.join(ICONS_DIR, 'icon.iconset')
  try {
    if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir)

    const iconsetSizes = [
      { file: 'icon_16x16.png', size: 16 },
      { file: 'icon_16x16@2x.png', size: 32 },
      { file: 'icon_32x32.png', size: 32 },
      { file: 'icon_32x32@2x.png', size: 64 },
      { file: 'icon_128x128.png', size: 128 },
      { file: 'icon_128x128@2x.png', size: 256 },
      { file: 'icon_256x256.png', size: 256 },
      { file: 'icon_256x256@2x.png', size: 512 },
      { file: 'icon_512x512.png', size: 512 },
      { file: 'icon_512x512@2x.png', size: 1024 }
    ]

    const sizeToSource = {
      16: 'icon-16.png',
      32: 'icon-32.png',
      64: 'icon-64.png',
      128: 'icon-128.png',
      256: 'icon-256.png',
      512: 'icon.png',
      1024: 'icon-1024.png'
    }

    for (const { file, size } of iconsetSizes) {
      const src = path.join(ICONS_DIR, sizeToSource[size])
      const dst = path.join(iconsetDir, file)
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst)
      }
    }

    execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(ICONS_DIR, 'icon.icns')}"`)
    console.log('  ✅ icon.icns 已生成')

    // 清理 iconset 目录
    fs.rmSync(iconsetDir, { recursive: true, force: true })
  } catch (e) {
    console.log(`  ❌ .icns 生成失败: ${e.message}`)
  }
}

// ---- 生成 Windows .ico ----
if (pngOk) {
  console.log('\n生成 Windows .ico ...')
  try {
    const icoSizes = ['icon-16.png', 'icon-32.png', 'icon-64.png', 'icon-128.png', 'icon-256.png']
      .map(f => path.join(ICONS_DIR, f))
      .filter(f => fs.existsSync(f))

    if (icoSizes.length > 0) {
      execSync(`convert ${icoSizes.join(' ')} "${path.join(ICONS_DIR, 'icon.ico')}"`)
      console.log('  ✅ icon.ico 已生成')
    }
  } catch (e) {
    console.log(`  ❌ .ico 生成失败: ${e.message}`)
  }
}

console.log('\n🎉 图标生成完毕!')
console.log(`   输出目录: ${ICONS_DIR}`)
