// ========================================
// 办公室拉伸动作数据
// ========================================

export interface StretchVideo {
  platform: 'bilibili' | 'youtube'
  id: string // BV号 或 YouTube videoId
  title: string
}

export interface StretchStep {
  text: string
  duration: number
  isRepeat?: boolean
  repeatRange?: [number, number] // [startIndex, endIndex) 重复哪些步骤（基于原始 steps 的索引）
  repeatCount?: number           // 重复几轮（不含首次执行）
}

export interface StretchAction {
  id: string
  name: string
  targetArea: string
  duration: number // 建议时长（秒）
  steps: StretchStep[]
  tips?: string
  videos?: StretchVideo[]
}

/**
 * 将含重复步骤的动作展开为扁平的执行序列。
 * 重复步骤会被展开为 repeatCount 轮对应范围的步骤。
 */
export function expandSteps(action: StretchAction): StretchStep[] {
  const result: StretchStep[] = []
  for (const step of action.steps) {
    if (step.isRepeat && step.repeatRange && step.repeatCount) {
      const [start, end] = step.repeatRange
      const stepsToRepeat = action.steps.slice(start, end)
      for (let round = 0; round < step.repeatCount; round++) {
        for (const s of stepsToRepeat) {
          result.push({
            ...s,
            text: `[${round + 2}轮] ${s.text}`
          })
        }
      }
    } else {
      result.push(step)
    }
  }
  return result
}

export const STRETCH_ACTIONS: StretchAction[] = [
  {
    id: 'neck-turn',
    name: '颈部左右转动',
    targetArea: '颈部',
    duration: 60,
    steps: [
      { text: '缓慢向右转头，保持 5 秒', duration: 8 },
      { text: '缓慢向左转头，保持 5 秒', duration: 8 },
      { text: '重复 3 次', duration: 0, isRepeat: true, repeatRange: [0, 2], repeatCount: 2 }
    ],
    tips: '动作要缓慢，避免快速转动',
    videos: [
      { platform: 'bilibili', id: 'BV17ECVYnEod', title: '6min 拯救白领肩颈' },
      { platform: 'youtube', id: 'RtuDx19TJdo', title: '5min Neck & Shoulder Stretch' }
    ]
  },
  {
    id: 'neck-nod',
    name: '颈部前后点头',
    targetArea: '颈部',
    duration: 60,
    steps: [
      { text: '缓慢向前低头，感受后颈拉伸，保持 5 秒', duration: 8 },
      { text: '缓慢向后仰头，感受前颈拉伸，保持 5 秒', duration: 8 },
      { text: '重复 3 次', duration: 0, isRepeat: true, repeatRange: [0, 2], repeatCount: 2 }
    ],
    tips: '动作幅度不要过大，以舒适为准',
    videos: [
      { platform: 'bilibili', id: 'BV14E411X7mU', title: '程序员肩颈酸痛拉伸' },
      { platform: 'youtube', id: '5lbe9oZbpDs', title: 'Neck Stretches - Mayo Clinic' }
    ]
  },
  {
    id: 'shoulder-roll',
    name: '肩部环绕',
    targetArea: '肩部',
    duration: 30,
    steps: [
      { text: '双肩向前环绕 5 次', duration: 12 },
      { text: '双肩向后环绕 5 次', duration: 12 },
      { text: '感受肩部肌肉放松', duration: 6 }
    ],
    tips: '动作要流畅，不要用力过猛',
    videos: [
      { platform: 'bilibili', id: 'BV1wy4y1p73y', title: '帕梅拉 久坐拉伸' },
      { platform: 'youtube', id: '1XkvW56LJ3c', title: 'Shoulder Stretches at Desk' }
    ]
  },
  {
    id: 'shoulder-stretch',
    name: '肩部交叉拉伸',
    targetArea: '肩部',
    duration: 40,
    steps: [
      { text: '右臂横过胸前，左手扶住右肘', duration: 3 },
      { text: '轻轻向左拉，感受右肩拉伸，保持 15 秒', duration: 15 },
      { text: '换另一侧重复', duration: 0, isRepeat: true, repeatRange: [0, 2], repeatCount: 1 }
    ],
    tips: '保持身体正直，不要侧倾',
    videos: [
      { platform: 'bilibili', id: 'BV1wy4y1p73y', title: '帕梅拉 久坐拉伸' },
      { platform: 'youtube', id: 'RtuDx19TJdo', title: '5min Neck & Shoulder Stretch' }
    ]
  },
  {
    id: 'back-twist',
    name: '腰部扭转',
    targetArea: '腰部',
    duration: 50,
    steps: [
      { text: '坐直，双手扶住椅背', duration: 3 },
      { text: '缓慢向右扭转上半身，保持 10 秒', duration: 10 },
      { text: '缓慢向左扭转上半身，保持 10 秒', duration: 10 },
      { text: '重复 2 次', duration: 0, isRepeat: true, repeatRange: [0, 3], repeatCount: 1 }
    ],
    tips: '扭转时保持臀部不动，只转动上半身',
    videos: [
      { platform: 'bilibili', id: 'BV13E411r7zq', title: '办公室腰部拉伸操' },
      { platform: 'youtube', id: 'TtjuytS3hmc', title: '5min Office Stretching' }
    ]
  },
  {
    id: 'back-side',
    name: '侧弯拉伸',
    targetArea: '腰部',
    duration: 50,
    steps: [
      { text: '坐直，右手举过头顶', duration: 3 },
      { text: '缓慢向左侧弯，感受右侧拉伸，保持 10 秒', duration: 10 },
      { text: '缓慢向右侧弯，感受左侧拉伸，保持 10 秒', duration: 10 },
      { text: '重复 2 次', duration: 0, isRepeat: true, repeatRange: [0, 3], repeatCount: 1 }
    ],
    tips: '保持臀部稳定，不要前倾或后仰',
    videos: [
      { platform: 'bilibili', id: 'BV13E411r7zq', title: '办公室腰部拉伸操' },
      { platform: 'youtube', id: 'kUxrEaxZId0', title: 'Office Stretches' }
    ]
  },
  {
    id: 'wrist-flex',
    name: '手腕前后弯曲',
    targetArea: '手腕',
    duration: 50,
    steps: [
      { text: '右臂前伸，左手握住右手手指', duration: 3 },
      { text: '向后弯曲手腕，保持 10 秒', duration: 10 },
      { text: '向前弯曲手腕，保持 10 秒', duration: 10 },
      { text: '换另一侧重复', duration: 0, isRepeat: true, repeatRange: [0, 3], repeatCount: 1 }
    ],
    tips: '动作要轻柔，避免过度拉伸',
    videos: [
      { platform: 'bilibili', id: 'BV1Wy4y137Lb', title: '3个腕部拉伸预防腱鞘炎' },
      { platform: 'youtube', id: 'bmznCBGMVaU', title: 'Desk Yoga for Wrists' }
    ]
  },
  {
    id: 'finger-stretch',
    name: '手指拉伸',
    targetArea: '手指',
    duration: 30,
    steps: [
      { text: '双手手指交叉，掌心向外', duration: 3 },
      { text: '向前推出手掌，感受手指和手腕拉伸，保持 10 秒', duration: 10 },
      { text: '重复 2 次', duration: 0, isRepeat: true, repeatRange: [0, 2], repeatCount: 1 }
    ],
    tips: '适合长时间打字后放松',
    videos: [
      { platform: 'bilibili', id: 'BV1ak4y1L7t4', title: '手腕关节按摩预防肌腱炎' },
      { platform: 'youtube', id: 'lRLY4MRboTg', title: 'Wrist Mobility Exercises' }
    ]
  },
  {
    id: 'leg-lift',
    name: '站立抬腿',
    targetArea: '腿部',
    duration: 55,
    steps: [
      { text: '站直，扶住椅背或桌面', duration: 3 },
      { text: '缓慢抬起右腿，保持 5 秒', duration: 5 },
      { text: '缓慢放下，抬起左腿，保持 5 秒', duration: 5 },
      { text: '每侧重复 4 次', duration: 0, isRepeat: true, repeatRange: [1, 3], repeatCount: 3 }
    ],
    tips: '保持身体平衡，动作要慢',
    videos: [
      { platform: 'bilibili', id: 'BV1wy4y1p73y', title: '帕梅拉 久坐拉伸' },
      { platform: 'youtube', id: 'o7Ob4TDI2WE', title: 'Office Yoga 5min' }
    ]
  },
  {
    id: 'calf-stretch',
    name: '小腿拉伸',
    targetArea: '小腿',
    duration: 40,
    steps: [
      { text: '站直，右脚向前迈一步', duration: 3 },
      { text: '左腿伸直，感受左小腿拉伸，保持 15 秒', duration: 15 },
      { text: '换另一侧重复', duration: 0, isRepeat: true, repeatRange: [0, 2], repeatCount: 1 }
    ],
    tips: '后脚跟要贴地，前腿膝盖不要超过脚尖',
    videos: [
      { platform: 'bilibili', id: 'BV1wy4y1p73y', title: '帕梅拉 久坐拉伸' },
      { platform: 'youtube', id: 'kdLSJuzRNUw', title: '5min Desk Stretches' }
    ]
  }
]

/** 计算展开后的实际总时长 */
export function getExpandedDuration(action: StretchAction): number {
  return expandSteps(action).reduce((sum, s) => sum + s.duration, 0)
}

/** 根据目标部位获取拉伸动作 */
export function getStretchesByTarget(targetArea: string): StretchAction[] {
  return STRETCH_ACTIONS.filter((s) => s.targetArea === targetArea)
}

/** 随机获取一个拉伸动作 */
export function getRandomStretch(): StretchAction {
  const index = Math.floor(Math.random() * STRETCH_ACTIONS.length)
  return STRETCH_ACTIONS[index]
}

/** 根据 ID 获取拉伸动作 */
export function getStretchById(id: string): StretchAction | undefined {
  return STRETCH_ACTIONS.find((s) => s.id === id)
}
