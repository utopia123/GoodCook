import 'server-only'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { dishes, meals, orders } from '@/lib/db/schema'
import { getSettings } from '@/lib/settings'
import { dayjs, todayLocal } from '@/lib/time'

export type DishHeat = {
  id: string
  name: string
  count: number
  daysAgo: number | null
}

/** 菜品热度：累计点单次数与距今天数（仅在用菜品） */
export function dishHeat(): { heat: DishHeat[]; neverCount: number } {
  const rows = db
    .select({
      dishId: orders.dishId,
      c: sql<number>`count(*)`,
      last: sql<string | null>`max(${meals.date})`,
    })
    .from(orders)
    .innerJoin(meals, eq(orders.mealId, meals.id))
    .groupBy(orders.dishId)
    .all()

  const map = new Map(rows.map((r) => [r.dishId, r]))
  const today = todayLocal(getSettings().timezone)

  const heat = db
    .select()
    .from(dishes)
    .where(eq(dishes.status, 'active'))
    .all()
    .map((d) => {
      const s = map.get(d.id)
      return {
        id: d.id,
        name: d.name,
        count: s?.c ?? 0,
        daysAgo: s?.last ? dayjs(today).diff(dayjs(s.last), 'day') : null,
      }
    })

  return { heat, neverCount: heat.filter((h) => h.count === 0).length }
}
