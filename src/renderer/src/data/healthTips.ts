// ========================================
// 健康知识卡片数据
// ========================================

export type HealthTipCategory = 'eye' | 'posture' | 'water' | 'exercise' | 'mindful'

export interface HealthTip {
  id: string
  category: HealthTipCategory
  title: string
  content: string
  source?: string
}

export const HEALTH_TIPS: HealthTip[] = [
  // ---- 护眼 (eye) ----
  {
    id: 'eye-1',
    category: 'eye',
    title: '20-20-20 法则',
    content: '每工作 20 分钟，注视 20 英尺（约 6 米）外的物体至少 20 秒。这能有效缓解数字眼疲劳。',
    source: '美国眼科学会'
  },
  {
    id: 'eye-2',
    category: 'eye',
    title: '屏幕亮度与环境光',
    content: '屏幕亮度应与环境光线匹配。过亮的屏幕会加速眼疲劳，过暗则让你不自觉地眯眼。',
    source: 'WHO 视觉健康指南'
  },
  {
    id: 'eye-3',
    category: 'eye',
    title: '蓝光与睡眠',
    content: '睡前 2 小时减少蓝光暴露。蓝光会抑制褪黑素分泌，影响入睡质量。可以使用暗色模式。',
    source: 'Harvard Health'
  },
  {
    id: 'eye-4',
    category: 'eye',
    title: '眨眼的重要性',
    content: '盯屏幕时眨眼频率会降低 60%。有意识地多眨眼可以保持角膜湿润，减少干眼症状。'
  },
  {
    id: 'eye-5',
    category: 'eye',
    title: '屏幕距离',
    content: '显示器应放在距眼睛约 50-70 厘米处，屏幕顶部与视线平齐或略低，减少颈部和眼睛的负担。',
    source: 'OSHA 工效学指南'
  },

  // ---- 姿势 (posture) ----
  {
    id: 'posture-1',
    category: 'posture',
    title: '理想坐姿',
    content: '双脚平放地面，膝盖弯曲约 90°，背部贴合椅背。这能减少 40% 的腰背压力。',
    source: 'WHO 工作场所健康指南'
  },
  {
    id: 'posture-2',
    category: 'posture',
    title: '显示器高度',
    content: '屏幕顶部应与眼睛同高。低头看屏幕会给颈椎增加约 12-27 公斤的额外压力。'
  },
  {
    id: 'posture-3',
    category: 'posture',
    title: '手腕位置',
    content: '打字时手腕应保持中立位（不上翘也不下弯）。使用腕托可减少腕管综合征风险。',
    source: 'OSHA 工效学指南'
  },
  {
    id: 'posture-4',
    category: 'posture',
    title: '动态坐姿',
    content: '没有"完美"坐姿。最好的姿势是下一个姿势——每 30 分钟变换一下坐姿是最健康的习惯。'
  },
  {
    id: 'posture-5',
    category: 'posture',
    title: '肩部放松',
    content: '检查一下你的肩膀是否在不自觉地耸起？有意识地让双肩下沉远离耳朵，减少颈肩紧张。'
  },

  // ---- 饮水 (water) ----
  {
    id: 'water-1',
    category: 'water',
    title: '每日饮水量',
    content: '成人每天建议摄入 1500-2000 ml 水。少量多次比一次喝大量更有利于身体吸收。',
    source: '中国居民膳食指南'
  },
  {
    id: 'water-2',
    category: 'water',
    title: '早起一杯水',
    content: '起床后喝一杯温水可以唤醒身体代谢，帮助排出夜间积累的废物。空腹温水效果最佳。'
  },
  {
    id: 'water-3',
    category: 'water',
    title: '脱水与注意力',
    content: '仅 1-2% 的轻度脱水就会显著降低注意力和工作记忆。感到口渴时身体已经缺水了。',
    source: 'Journal of Nutrition'
  },
  {
    id: 'water-4',
    category: 'water',
    title: '水温选择',
    content: '温水（40-50°C）比冰水更容易被胃肠吸收。办公时准备一杯温水是最方便的补水方式。'
  },

  // ---- 运动 (exercise) ----
  {
    id: 'exercise-1',
    category: 'exercise',
    title: '久坐的代价',
    content: '连续久坐超过 1 小时，血液循环减慢 50%，患心血管疾病风险显著增加。站起来走动 2 分钟就能缓解。',
    source: 'WHO'
  },
  {
    id: 'exercise-2',
    category: 'exercise',
    title: '微运动的力量',
    content: '研究表明，每天累计 30 分钟的"微运动"（如站立、拉伸、走动）与 30 分钟连续运动同样有益。'
  },
  {
    id: 'exercise-3',
    category: 'exercise',
    title: '站立办公',
    content: '站-坐交替是最理想的办公方式。每小时站立 15-20 分钟可以改善血糖水平和背部健康。'
  },
  {
    id: 'exercise-4',
    category: 'exercise',
    title: '走路的魔力',
    content: '午休时散步 10 分钟就能提升下午的创造力和注意力。行走还能促进海马体活动，增强记忆。',
    source: 'Stanford University'
  },

  // ---- 正念 (mindful) ----
  {
    id: 'mindful-1',
    category: 'mindful',
    title: '3 分钟的奇迹',
    content: '研究显示仅 3 分钟的正念呼吸就能显著降低皮质醇水平，减轻压力感。不需要长时间冥想也能受益。',
    source: 'Mindfulness Research'
  },
  {
    id: 'mindful-2',
    category: 'mindful',
    title: '注意力恢复',
    content: '持续专注 25-50 分钟后注意力开始下降。短暂的正念休息比"硬撑"更能恢复认知资源。'
  },
  {
    id: 'mindful-3',
    category: 'mindful',
    title: '一次只做一件事',
    content: '多任务切换会使效率降低 40%，错误率增加 50%。试着在接下来的工作中，专注完成一件事。',
    source: 'APA'
  },
  {
    id: 'mindful-4',
    category: 'mindful',
    title: '情绪觉察',
    content: '在忙碌中暂停一下，问自己"我现在感觉怎样？"。觉察情绪本身就能降低它的强度。',
    source: 'UCLA Mindful'
  },
  {
    id: 'mindful-5',
    category: 'mindful',
    title: '深呼吸的科学',
    content: '缓慢的腹式呼吸能激活副交感神经系统，让心率降低、血压下降，帮助身体进入放松状态。'
  }
]

let shownTipIds: string[] = []

export function getRandomHealthTip(categories?: HealthTipCategory[]): HealthTip {
  let pool = HEALTH_TIPS
  if (categories && categories.length > 0) {
    pool = pool.filter((t) => categories.includes(t.category))
  }

  const unseen = pool.filter((t) => !shownTipIds.includes(t.id))
  const available = unseen.length > 0 ? unseen : pool

  if (unseen.length === 0) {
    shownTipIds = []
  }

  const tip = available[Math.floor(Math.random() * available.length)]
  shownTipIds.push(tip.id)
  return tip
}

const CATEGORY_LABELS: Record<HealthTipCategory, string> = {
  eye: '护眼',
  posture: '姿势',
  water: '饮水',
  exercise: '运动',
  mindful: '正念'
}

export function getCategoryLabel(category: HealthTipCategory): string {
  return CATEGORY_LABELS[category]
}

const CATEGORY_ICONS: Record<HealthTipCategory, string> = {
  eye: '👁️',
  posture: '🪑',
  water: '💧',
  exercise: '🏃',
  mindful: '🧘'
}

export function getCategoryIcon(category: HealthTipCategory): string {
  return CATEGORY_ICONS[category]
}
