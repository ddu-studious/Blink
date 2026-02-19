// ========================================
// 办公室拉伸动作数据
// ========================================

export interface StretchAction {
  id: string
  name: string
  targetArea: string // 目标部位
  duration: number // 建议时长（秒）
  steps: string[] // 步骤说明
  tips?: string // 注意事项
}

export const STRETCH_ACTIONS: StretchAction[] = [
  {
    id: 'neck-turn',
    name: '颈部左右转动',
    targetArea: '颈部',
    duration: 30,
    steps: [
      '缓慢向右转头，保持 5 秒',
      '缓慢向左转头，保持 5 秒',
      '重复 3-5 次'
    ],
    tips: '动作要缓慢，避免快速转动'
  },
  {
    id: 'neck-nod',
    name: '颈部前后点头',
    targetArea: '颈部',
    duration: 30,
    steps: [
      '缓慢向前低头，感受后颈拉伸，保持 5 秒',
      '缓慢向后仰头，感受前颈拉伸，保持 5 秒',
      '重复 3-5 次'
    ],
    tips: '动作幅度不要过大，以舒适为准'
  },
  {
    id: 'shoulder-roll',
    name: '肩部环绕',
    targetArea: '肩部',
    duration: 30,
    steps: [
      '双肩向前环绕 5 次',
      '双肩向后环绕 5 次',
      '感受肩部肌肉放松'
    ],
    tips: '动作要流畅，不要用力过猛'
  },
  {
    id: 'shoulder-stretch',
    name: '肩部交叉拉伸',
    targetArea: '肩部',
    duration: 30,
    steps: [
      '右臂横过胸前，左手扶住右肘',
      '轻轻向左拉，感受右肩拉伸，保持 15 秒',
      '换另一侧重复'
    ],
    tips: '保持身体正直，不要侧倾'
  },
  {
    id: 'back-twist',
    name: '腰部扭转',
    targetArea: '腰部',
    duration: 30,
    steps: [
      '坐直，双手扶住椅背',
      '缓慢向右扭转上半身，保持 10 秒',
      '缓慢向左扭转上半身，保持 10 秒',
      '重复 2-3 次'
    ],
    tips: '扭转时保持臀部不动，只转动上半身'
  },
  {
    id: 'back-side',
    name: '侧弯拉伸',
    targetArea: '腰部',
    duration: 30,
    steps: [
      '坐直，右手举过头顶',
      '缓慢向左侧弯，感受右侧拉伸，保持 10 秒',
      '缓慢向右侧弯，感受左侧拉伸，保持 10 秒',
      '重复 2-3 次'
    ],
    tips: '保持臀部稳定，不要前倾或后仰'
  },
  {
    id: 'wrist-flex',
    name: '手腕前后弯曲',
    targetArea: '手腕',
    duration: 30,
    steps: [
      '右臂前伸，左手握住右手手指',
      '向后弯曲手腕，保持 10 秒',
      '向前弯曲手腕，保持 10 秒',
      '换另一侧重复'
    ],
    tips: '动作要轻柔，避免过度拉伸'
  },
  {
    id: 'finger-stretch',
    name: '手指拉伸',
    targetArea: '手指',
    duration: 20,
    steps: [
      '双手手指交叉，掌心向外',
      '向前推出手掌，感受手指和手腕拉伸，保持 10 秒',
      '重复 2-3 次'
    ],
    tips: '适合长时间打字后放松'
  },
  {
    id: 'leg-lift',
    name: '站立抬腿',
    targetArea: '腿部',
    duration: 30,
    steps: [
      '站直，扶住椅背或桌面',
      '缓慢抬起右腿，保持 5 秒',
      '缓慢放下，抬起左腿，保持 5 秒',
      '每侧重复 5 次'
    ],
    tips: '保持身体平衡，动作要慢'
  },
  {
    id: 'calf-stretch',
    name: '小腿拉伸',
    targetArea: '小腿',
    duration: 30,
    steps: [
      '站直，右脚向前迈一步',
      '左腿伸直，感受左小腿拉伸，保持 15 秒',
      '换另一侧重复'
    ],
    tips: '后脚跟要贴地，前腿膝盖不要超过脚尖'
  }
]

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
