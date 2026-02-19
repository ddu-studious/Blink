// ========================================
// 正念引导练习数据
// ========================================

export interface MindfulStep {
  text: string
  duration: number // 停留秒数
}

export interface MindfulExercise {
  id: string
  name: string
  description: string
  totalDuration: number // 总时长（秒）
  steps: MindfulStep[]
  suitable: string // 适合场景
}

export const MINDFUL_EXERCISES: MindfulExercise[] = [
  {
    id: 'breath-counting',
    name: '呼吸计数',
    description: '跟随节奏呼吸，从 1 数到 7，让注意力回归当下',
    totalDuration: 120,
    suitable: '任何时候',
    steps: [
      { text: '找到一个舒适的姿势，轻轻闭上眼睛', duration: 5 },
      { text: '自然呼吸几次，让身体放松', duration: 8 },
      { text: '第 1 次深呼吸 — 缓慢吸气…', duration: 4 },
      { text: '屏住…', duration: 2 },
      { text: '缓慢呼气，释放紧张', duration: 6 },
      { text: '第 2 次 — 吸气，感受空气充满胸腔…', duration: 4 },
      { text: '屏住…', duration: 2 },
      { text: '呼气，感受肩膀下沉放松', duration: 6 },
      { text: '第 3 次 — 吸气…', duration: 4 },
      { text: '屏住…', duration: 2 },
      { text: '呼气…让一切思绪随呼吸流走', duration: 6 },
      { text: '第 4 次 — 深深吸气…', duration: 4 },
      { text: '屏住…', duration: 2 },
      { text: '呼气…感受内心的平静', duration: 6 },
      { text: '第 5 次 — 吸气…', duration: 4 },
      { text: '屏住…', duration: 2 },
      { text: '呼气…', duration: 6 },
      { text: '第 6 次 — 吸气…', duration: 4 },
      { text: '屏住…', duration: 2 },
      { text: '呼气…身体越来越放松', duration: 6 },
      { text: '第 7 次 — 最后一次深呼吸…吸气…', duration: 4 },
      { text: '屏住…', duration: 2 },
      { text: '缓慢呼气…完全放松', duration: 6 },
      { text: '回到自然呼吸，感受此刻的宁静', duration: 8 },
      { text: '慢慢睁开眼睛，带着这份平静回到工作中', duration: 8 }
    ]
  },
  {
    id: '478-breathing',
    name: '4-7-8 呼吸法',
    description: '吸 4 秒、屏 7 秒、呼 8 秒，经典的放松呼吸技巧',
    totalDuration: 130,
    suitable: '感到焦虑或压力大时',
    steps: [
      { text: '坐直身体，舌尖抵住上颚', duration: 5 },
      { text: '完全呼出口中的空气', duration: 5 },
      { text: '第 1 轮 — 用鼻子吸气 4 秒…', duration: 4 },
      { text: '屏住呼吸 7 秒…保持…', duration: 7 },
      { text: '用嘴缓慢呼气 8 秒…', duration: 8 },
      { text: '第 2 轮 — 吸气 4 秒…', duration: 4 },
      { text: '屏住 7 秒…', duration: 7 },
      { text: '呼气 8 秒…感受身体的放松', duration: 8 },
      { text: '第 3 轮 — 吸气…', duration: 4 },
      { text: '屏住…让身体充满能量', duration: 7 },
      { text: '呼气…释放所有紧张', duration: 8 },
      { text: '第 4 轮 — 最后一轮，吸气…', duration: 4 },
      { text: '屏住…', duration: 7 },
      { text: '缓慢呼气…完全放松', duration: 8 },
      { text: '回到自然呼吸', duration: 8 },
      { text: '感受呼吸带来的平静，准备好了就睁开眼睛', duration: 8 }
    ]
  },
  {
    id: 'body-scan',
    name: '身体扫描',
    description: '从头到脚逐步感知身体各部位，释放不自觉的紧张',
    totalDuration: 150,
    suitable: '久坐后感到身体僵硬时',
    steps: [
      { text: '闭上眼睛，做三次深呼吸', duration: 10 },
      { text: '将注意力带到头顶…感受头皮是否有紧张', duration: 10 },
      { text: '放松前额…眉毛…眼睛周围的肌肉', duration: 10 },
      { text: '放松下巴…让嘴唇微微分开', duration: 8 },
      { text: '感受颈部…如果有紧张，想象温暖的光照在那里', duration: 10 },
      { text: '放松双肩…让它们远离耳朵，自然下沉', duration: 10 },
      { text: '感受手臂…手肘…手腕…指尖', duration: 10 },
      { text: '将注意力带到胸口…感受每一次呼吸的起伏', duration: 10 },
      { text: '放松腹部…不需要收紧', duration: 8 },
      { text: '感受腰部和下背…这里常常积累压力', duration: 10 },
      { text: '放松臀部…大腿…膝盖', duration: 10 },
      { text: '感受小腿…脚踝…脚底', duration: 10 },
      { text: '现在感受整个身体…从头到脚，充满轻松', duration: 10 },
      { text: '深吸一口气…缓慢呼出', duration: 8 },
      { text: '慢慢睁开眼睛，感受焕然一新的身体', duration: 8 }
    ]
  },
  {
    id: 'gratitude',
    name: '感恩冥想',
    description: '回想三件值得感恩的小事，培养积极心态',
    totalDuration: 120,
    suitable: '心情低落或需要正能量时',
    steps: [
      { text: '闭上眼睛，做几次深呼吸', duration: 10 },
      { text: '想一件今天让你微笑的小事…', duration: 5 },
      { text: '可能是一杯好喝的咖啡，或同事的一句关心', duration: 10 },
      { text: '感受这份温暖…在心里说声"谢谢"', duration: 10 },
      { text: '再想一件…也许是一个顺利完成的任务', duration: 5 },
      { text: '或是窗外的阳光，路上遇到的花', duration: 10 },
      { text: '感受这份美好…', duration: 10 },
      { text: '最后，想一个你感激的人…', duration: 5 },
      { text: '可能是家人、朋友、或今天帮助过你的人', duration: 10 },
      { text: '在心里送上感谢和祝福', duration: 10 },
      { text: '深呼吸…让感恩的能量充满全身', duration: 10 },
      { text: '带着这份温暖，慢慢睁开眼睛', duration: 8 }
    ]
  },
  {
    id: 'five-senses',
    name: '五感觉察',
    description: '依次调动五种感官，快速回归当下',
    totalDuration: 110,
    suitable: '注意力涣散、思绪飘散时',
    steps: [
      { text: '停下手中的一切，做两次深呼吸', duration: 8 },
      { text: '👀 看 — 环顾四周，注意 5 样你能看到的东西', duration: 12 },
      { text: '注意它们的颜色、形状、光影', duration: 8 },
      { text: '✋ 触 — 感受 4 种触觉', duration: 5 },
      { text: '键盘的触感、椅子的支撑、脚下的地面、衣服的质地', duration: 12 },
      { text: '👂 听 — 聆听 3 种声音', duration: 5 },
      { text: '也许是风扇声、远处的交谈、或自己的呼吸', duration: 12 },
      { text: '👃 闻 — 注意 2 种气味', duration: 5 },
      { text: '可能是咖啡香、纸张味、或空气的清新', duration: 12 },
      { text: '👅 尝 — 感受 1 种味道', duration: 5 },
      { text: '嘴里残留的茶香，或舌尖上淡淡的味道', duration: 10 },
      { text: '深呼吸…你已经完全回到了当下', duration: 8 },
      { text: '带着这份清醒，回到你的工作', duration: 8 }
    ]
  },
  {
    id: 'shoulder-release',
    name: '肩颈放松呼吸',
    description: '配合呼吸的肩颈紧张-放松练习，释放办公疲劳',
    totalDuration: 120,
    suitable: '肩颈酸痛时',
    steps: [
      { text: '坐直身体，双手自然放在膝盖上', duration: 5 },
      { text: '吸气，同时慢慢耸起双肩，尽量靠近耳朵', duration: 5 },
      { text: '保持…感受肩膀的紧张', duration: 5 },
      { text: '呼气，突然放下双肩，完全放松', duration: 5 },
      { text: '感受紧张消散的感觉…', duration: 8 },
      { text: '再来一次 — 吸气耸肩…', duration: 5 },
      { text: '保持…', duration: 5 },
      { text: '呼气放下…', duration: 5 },
      { text: '放松…', duration: 8 },
      { text: '现在，吸气时慢慢把头向右倾斜', duration: 6 },
      { text: '感受左侧颈部的拉伸…保持…', duration: 8 },
      { text: '呼气回正', duration: 4 },
      { text: '吸气向左倾斜…', duration: 6 },
      { text: '感受右侧颈部的拉伸…保持…', duration: 8 },
      { text: '呼气回正', duration: 4 },
      { text: '轻轻转动颈部画一个圆…', duration: 10 },
      { text: '反方向再画一个圆…', duration: 10 },
      { text: '回到中立位，深呼吸，感受放松的肩颈', duration: 8 }
    ]
  }
]

export function getRandomMindfulExercise(): MindfulExercise {
  return MINDFUL_EXERCISES[Math.floor(Math.random() * MINDFUL_EXERCISES.length)]
}

export function getMindfulExerciseById(id: string): MindfulExercise | undefined {
  return MINDFUL_EXERCISES.find((e) => e.id === id)
}
