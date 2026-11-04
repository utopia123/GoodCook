import 'server-only'
import { db } from '@/lib/db/client'
import { condiments, mealSchedules } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

/** 首次初始化时写入默认自动饭局规则（午餐、晚餐；早餐默认关闭） */
export function seedDefaultSchedules(): void {
  const existing = db
    .select({ c: sql<number>`count(*)` })
    .from(mealSchedules)
    .get()
  if ((existing?.c ?? 0) > 0) return

  db.insert(mealSchedules)
    .values([
      {
        name: '每日午餐',
        mealType: 'lunch',
        enabled: true,
        diningTime: '12:00',
        createLeadHours: 16, // 前一天 20:00 开次日午餐
        deadlineLeadMinutes: 120, // 10:00 截止
        weekdays: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        name: '每日晚餐',
        mealType: 'dinner',
        enabled: true,
        diningTime: '18:30',
        createLeadHours: 10, // 当天 08:30 开
        deadlineLeadMinutes: 150, // 16:00 截止
        weekdays: [0, 1, 2, 3, 4, 5, 6],
      },
    ])
    .run()
}


// ── 常用佐料 / 香料 / 调味料种子（幂等：按 id 与名称双重去重） ──

type SeedCondiment = {
  id: string
  name: string
  kind: 'aromatic' | 'spice' | 'seasoning'
  effect: string
  goodWith: string
  avoidWith: string
}

export const SEED_CONDIMENTS: SeedCondiment[] = [
  { id: 'seed-c-1', name: '大蒜', kind: 'aromatic', effect: '杀菌、去腥增香、提味', goodWith: '炒青菜、红烧、凉拌、蒜蓉粉丝', avoidWith: '清淡海鲜（容易抢味）' },
  { id: 'seed-c-2', name: '生姜', kind: 'aromatic', effect: '去腥、驱寒、和胃', goodWith: '炖肉、蒸鱼、煮汤', avoidWith: '清炒嫩叶菜（易焦苦）' },
  { id: 'seed-c-3', name: '大葱', kind: 'aromatic', effect: '增香、发汗、去腥', goodWith: '爆炒、烧菜、蘸酱', avoidWith: '清淡汤品（味道冲）' },
  { id: 'seed-c-4', name: '小米辣', kind: 'aromatic', effect: '增辣提味、开胃', goodWith: '水煮菜、小炒肉、凉拌', avoidWith: '清蒸海鲜、老人小孩的菜' },
  { id: 'seed-c-5', name: '香菜', kind: 'aromatic', effect: '提香解腻、点缀', goodWith: '汤、凉菜、面食收尾', avoidWith: '有人不吃，建议单独上桌' },
  { id: 'seed-c-21', name: '小葱', kind: 'aromatic', effect: '增香、提色、收尾点缀', goodWith: '汤面、凉菜、蒸鱼', avoidWith: '长时间炖煮（会发黄失香）' },
  { id: 'seed-c-22', name: '洋葱', kind: 'aromatic', effect: '增甜提香、去腥', goodWith: '炒肉、炖牛腩、咖喱', avoidWith: '清蒸类（味道过重）' },
  { id: 'seed-c-23', name: '蒜苗', kind: 'aromatic', effect: '蒜香浓郁、增味', goodWith: '回锅肉、炒腊肉、干锅', avoidWith: '清淡汤品' },
  { id: 'seed-c-24', name: '干辣椒', kind: 'aromatic', effect: '干香微辣、增色', goodWith: '炝炒、干锅、水煮', avoidWith: '清炒时蔬（易糊发苦）' },
  { id: 'seed-c-25', name: '泡椒', kind: 'aromatic', effect: '酸辣开胃、去腥', goodWith: '泡椒凤爪、鱼香肉丝', avoidWith: '清淡菜与甜口菜' },
  { id: 'seed-c-26', name: '紫苏', kind: 'aromatic', effect: '去腥提香、解腻', goodWith: '炒田螺、蒸鱼、煮蟹', avoidWith: '气味强烈，少量即可' },

  { id: 'seed-c-6', name: '花椒', kind: 'spice', effect: '麻香、去腥、温中散寒', goodWith: '麻婆豆腐、水煮鱼、卤味', avoidWith: '清蒸鱼（抢鲜味）' },
  { id: 'seed-c-7', name: '黑胡椒', kind: 'spice', effect: '增香提味、暖胃', goodWith: '煎牛排、炒蛋、西式汤', avoidWith: '清蒸菜、清汤' },
  { id: 'seed-c-8', name: '八角', kind: 'spice', effect: '增香、去腥', goodWith: '红烧肉、卤味、炖牛腩', avoidWith: '清汤、炒青菜（药味重）' },
  { id: 'seed-c-9', name: '桂皮', kind: 'spice', effect: '增香、暖胃', goodWith: '卤味、红烧、甜汤', avoidWith: '清炒、海鲜' },
  { id: 'seed-c-10', name: '香叶', kind: 'spice', effect: '增香、去腥', goodWith: '卤煮、炖肉', avoidWith: '放多会发苦，清淡菜不放' },
  { id: 'seed-c-11', name: '孜然', kind: 'spice', effect: '去膻增香', goodWith: '羊肉、烤串、土豆', avoidWith: '清蒸、清淡汤品' },
  { id: 'seed-c-12', name: '五香粉', kind: 'spice', effect: '复合香气、去腥增味', goodWith: '卤味、炸物腌料', avoidWith: '清炒时蔬（味重）' },
  { id: 'seed-c-27', name: '白胡椒', kind: 'spice', effect: '去腥提鲜、暖胃、较温和', goodWith: '汤羹、鱼丸、猪肚', avoidWith: '本身鲜味足的清汤（可省）' },
  { id: 'seed-c-28', name: '辣椒粉', kind: 'spice', effect: '增辣增色', goodWith: '烤肉、干锅、凉拌', avoidWith: '高温久炒（易糊）' },
  { id: 'seed-c-29', name: '花椒粉', kind: 'spice', effect: '麻香、去腥', goodWith: '麻婆豆腐、凉面、蘸料', avoidWith: '出锅前再撒，久煮失麻' },
  { id: 'seed-c-30', name: '小茴香', kind: 'spice', effect: '清香去腥、解腻', goodWith: '卤味、炖羊肉、包子馅', avoidWith: '清淡海鲜' },
  { id: 'seed-c-31', name: '草果', kind: 'spice', effect: '去腥除膻、增香', goodWith: '卤牛肉、炖羊肉、火锅底料', avoidWith: '用多会苦，需拍破去籽' },
  { id: 'seed-c-32', name: '丁香', kind: 'spice', effect: '香气浓烈、增香', goodWith: '卤味、红烧（极少量）', avoidWith: '清炒、汤品（一粒就够）' },
  { id: 'seed-c-33', name: '白芷', kind: 'spice', effect: '去腥除膻、增香', goodWith: '卤味、炖羊肉、火锅', avoidWith: '清淡菜（药味明显）' },
  { id: 'seed-c-34', name: '良姜', kind: 'spice', effect: '去腥、增香、暖胃', goodWith: '卤味、炖肉、火锅底料', avoidWith: '清炒蔬菜' },
  { id: 'seed-c-35', name: '陈皮', kind: 'spice', effect: '理气解腻、增清香', goodWith: '红烧肉、卤味、糖水', avoidWith: '清淡蒸菜（味道干扰）' },
  { id: 'seed-c-36', name: '十三香', kind: 'spice', effect: '复合香、去腥增味', goodWith: '卤味、炸物、包子馅', avoidWith: '清炒时蔬（压本味）' },
  { id: 'seed-c-37', name: '咖喱粉', kind: 'spice', effect: '复合辛香、增色', goodWith: '咖喱鸡、土豆牛腩', avoidWith: '清淡菜与鲜味海鲜' },

  { id: 'seed-c-13', name: '生抽', kind: 'seasoning', effect: '提鲜、提供咸味', goodWith: '炒菜、凉拌、腌制', avoidWith: '红烧上色（色浅）' },
  { id: 'seed-c-14', name: '老抽', kind: 'seasoning', effect: '上色、酱香', goodWith: '红烧、卤味、焖菜', avoidWith: '凉拌、清炒（易发黑）' },
  { id: 'seed-c-15', name: '料酒', kind: 'seasoning', effect: '去腥、解腻', goodWith: '肉类焯水、腌鱼、烧菜', avoidWith: '素菜、凉菜' },
  { id: 'seed-c-16', name: '香醋', kind: 'seasoning', effect: '解腻、开胃、提酸香', goodWith: '糖醋菜、凉拌、醋溜', avoidWith: '绿叶菜久煮（易发黄）' },
  { id: 'seed-c-17', name: '蚝油', kind: 'seasoning', effect: '提鲜、增稠挂汁', goodWith: '炒青菜、焖菜、拌馅', avoidWith: '高温久炒（失鲜味）' },
  { id: 'seed-c-18', name: '盐', kind: 'seasoning', effect: '基础咸味、提升鲜味', goodWith: '几乎所有菜', avoidWith: '出锅前再补，避免过咸' },
  { id: 'seed-c-19', name: '白糖', kind: 'seasoning', effect: '提鲜、中和咸酸、炒糖色', goodWith: '红烧、糖醋、凉拌', avoidWith: '不需要甜味的清汤' },
  { id: 'seed-c-20', name: '豆瓣酱', kind: 'seasoning', effect: '增香提色、咸鲜微辣', goodWith: '回锅肉、麻婆豆腐、水煮菜', avoidWith: '清淡菜（过咸过辣）' },
  { id: 'seed-c-38', name: '香油', kind: 'seasoning', effect: '增香提味', goodWith: '凉拌、汤面、出锅前淋', avoidWith: '高温炒制（香味会跑掉）' },
  { id: 'seed-c-39', name: '辣椒油', kind: 'seasoning', effect: '香辣提味、增色', goodWith: '凉拌、面食、蘸料', avoidWith: '清淡汤菜、儿童餐' },
  { id: 'seed-c-40', name: '甜面酱', kind: 'seasoning', effect: '甜咸酱香、增稠', goodWith: '京酱肉丝、蘸酱、烤鸭', avoidWith: '清淡菜（味重偏咸）' },
  { id: 'seed-c-41', name: '黄豆酱', kind: 'seasoning', effect: '酱香浓、咸鲜', goodWith: '炸酱面、炖菜、蘸酱', avoidWith: '清淡汤品' },
  { id: 'seed-c-42', name: '番茄酱', kind: 'seasoning', effect: '酸甜提色', goodWith: '番茄炒蛋、糖醋菜、意面', avoidWith: '本身番茄味足时（可省）' },
  { id: 'seed-c-43', name: '芝麻酱', kind: 'seasoning', effect: '坚果香、增稠', goodWith: '麻酱凉面、涮锅蘸料、拌菜', avoidWith: '高温久煮（易糊底）' },
  { id: 'seed-c-44', name: '腐乳', kind: 'seasoning', effect: '咸鲜带酒香、增味', goodWith: '炒空心菜、涮锅蘸料、红烧', avoidWith: '清淡菜（盐分高）' },
  { id: 'seed-c-45', name: '鱼露', kind: 'seasoning', effect: '咸鲜、提味', goodWith: '东南亚菜、凉拌、汤粉', avoidWith: '用量过多会腥' },
  { id: 'seed-c-46', name: '蒸鱼豉油', kind: 'seasoning', effect: '清鲜回甜、提味', goodWith: '清蒸鱼、白灼虾、蒸蛋', avoidWith: '重口味红烧（被盖住）' },
  { id: 'seed-c-47', name: '鸡精', kind: 'seasoning', effect: '增鲜', goodWith: '汤、炒菜、炒饭', avoidWith: '清淡高端食材（抢本味）' },
  { id: 'seed-c-48', name: '味精', kind: 'seasoning', effect: '单纯增鲜', goodWith: '汤、炒菜', avoidWith: '与鸡精重复使用，出锅前放' },
  { id: 'seed-c-49', name: '冰糖', kind: 'seasoning', effect: '甜味温和、炒糖色', goodWith: '红烧、卤味、甜汤', avoidWith: '不需要甜味的菜' },
  { id: 'seed-c-50', name: '陈醋', kind: 'seasoning', effect: '醇厚酸香、解腻', goodWith: '饺子蘸料、醋溜、凉拌', avoidWith: '清蒸海鲜（盖鲜）' },
  { id: 'seed-c-51', name: '蜂蜜', kind: 'seasoning', effect: '甜味、上色、润口', goodWith: '烤鸡翅、凉拌、饮品', avoidWith: '高温久烤（易焦苦）' },
]

/** 幂等写入常用佐料：按 id 与名称双重去重，不影响用户自建内容 */
export function ensureSeedCondiments(): void {
  const rows = db
    .select({ id: condiments.id, name: condiments.name })
    .from(condiments)
    .all()
  const ids = new Set(rows.map((r) => r.id))
  const names = new Set(rows.map((r) => r.name))

  for (const c of SEED_CONDIMENTS) {
    if (ids.has(c.id) || names.has(c.name)) continue
    db.insert(condiments)
      .values({
        id: c.id,
        name: c.name,
        kind: c.kind,
        effect: c.effect,
        goodWith: c.goodWith,
        avoidWith: c.avoidWith,
      })
      .run()
  }
}
