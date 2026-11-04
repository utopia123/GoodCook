import 'server-only'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { dishes, meals, monthlyReports, orders } from '@/lib/db/schema'
import { getSettings } from '@/lib/settings'
import { dayjs, todayLocal } from '@/lib/time'

export type MonthlySummary = {
  month: string
  meals: number
  orders: number
  topDishes: { name: string; count: number }[]
}

/** 统计指定月份（YYYY-MM）的概况 */
export function buildMonthlySummary(month: string): MonthlySummary {
  const from = `${month}-01`
  const to = `${month}-31`

  const mealCount =
    db
      .select({ c: sql<number>`count(*)` })
      .from(meals)
      .where(sql`${meals.date} between ${from} and ${to}`)
      .get()?.c ?? 0

  const orderRows = db
    .select({
      dishId: orders.dishId,
      c: sql<number>`count(*)`,
    })
    .from(orders)
    .innerJoin(meals, eq(orders.mealId, meals.id))
    .where(sql`${meals.date} between ${from} and ${to}`)
    .groupBy(orders.dishId)
    .all()

  const orderTotal = orderRows.reduce((sum, r) => sum + r.c, 0)
  const nameOf = new Map(
    db.select({ id: dishes.id, name: dishes.name }).from(dishes).all().map((d) => [d.id, d.name]),
  )

  const topDishes = orderRows
    .sort((a, b) => b.c - a.c)
    .slice(0, 3)
    .map((r) => ({ name: nameOf.get(r.dishId) ?? '', count: r.c }))
    .filter((d) => d.name)

  return { month, meals: mealCount, orders: orderTotal, topDishes }
}

/** 补齐上月回顾（每月 1 号之后执行一次，幂等） */
export function ensureMonthlyReports(): void {
  try {
    const today = dayjs(todayLocal(getSettings().timezone))
    const month = today.subtract(1, 'month').format('YYYY-MM')
    const exists = db
      .select({ month: monthlyReports.month })
      .from(monthlyReports)
      .where(eq(monthlyReports.month, month))
      .get()
    if (exists) return

    const summary = buildMonthlySummary(month)
    db.insert(monthlyReports)
      .values({
        month,
        meals: summary.meals,
        orders: summary.orders,
        topDishes: JSON.stringify(summary.topDishes),
      })
      .onConflictDoNothing()
      .run()
    console.log('[report] 已生成月度回顾', month)
  } catch (e) {
    console.error('[report] 生成月度回顾失败', e)
  }
}

/** 最近一条月度回顾（用于主页展示） */
export function latestMonthlyReport(): MonthlySummary | null {
  const row = db
    .select()
    .from(monthlyReports)
    .orderBy(sql`${monthlyReports.month} desc`)
    .limit(1)
    .get()
  if (!row) return null
  let topDishes: { name: string; count: number }[] = []
  try {
    topDishes = JSON.parse(row.topDishes) as { name: string; count: number }[]
  } catch {
    topDishes = []
  }
  return {
    month: row.month,
    meals: row.meals,
    orders: row.orders,
    topDishes,
  }
}
