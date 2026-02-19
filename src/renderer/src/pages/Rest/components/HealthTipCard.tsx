// ========================================
// 健康知识卡片 - 所有休息模式底部展示
// ========================================

import { useState } from 'react'
import { getRandomHealthTip, getCategoryIcon, type HealthTip } from '../../../data/healthTips'

type HealthTipCategory = 'eye' | 'posture' | 'water' | 'exercise' | 'mindful'

interface HealthTipCardProps {
  categories?: HealthTipCategory[]
  className?: string
}

export default function HealthTipCard({ categories, className = '' }: HealthTipCardProps) {
  const [tip] = useState<HealthTip>(() => getRandomHealthTip(categories))

  return (
    <div
      className={`px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl max-w-sm ${className}`}
    >
      <p className="text-xs text-white/25 mb-1.5">
        {getCategoryIcon(tip.category)} {tip.title}
      </p>
      <p className="text-xs text-white/40 leading-relaxed">{tip.content}</p>
      {tip.source && <p className="text-[10px] text-white/15 mt-1.5">📎 {tip.source}</p>}
    </div>
  )
}
