import { Plus, ChefHat, SearchX } from 'lucide-react'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  dishes as dishesTable,
  dishCategories,
  meals as mealsTable,
  orders,
} from '@/lib/db/schema'
import { requireUser } from '@/lib/auth/user'
import { getSettings } from '@/lib/settings'
import { dayjs, todayLocal } from '@/lib/time'
import { getT } from '@/lib/i18n/server'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { DishForm } from '@/components/dishes/dish-form'
import { CategoryBar } from '@/components/dishes/category-bar'
import { DishesBrowser } from '@/components/dishes/dishes-browser'
import { DishInsights, type InsightCard } from '@/components/dishes/dish-insights'
import { DishIo } from '@/components/dishes/dish-io'

export const dynamic = 'force-dynamic'

export default async function DishesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  const me = await requireUser()
  const t = await getT()
  const tz = getSettings().timezone

  const all = db
    .select()
    .from(dishesTable)
    .orderBy(desc(dishesTable.createdAt))
    .all()
  const categories = db
    .select()
    .from(dishCategories)
    .orderBy(asc(dishCategories.sortOrder))
    .all()

  const active = all.filter((d) => d.status === 'active')
  const archived = all.filter((d) => d.status === 'archived')
  const canManage = (createdBy: string | null) =>
    createdBy === me.id || me.isAdmin

  // 分类计数（基于在架菜品）与过滤
  const categoryName = new Map(categories.map((c) => [c.id, c.name]))
  const categoriesWithCount = categories.map((c) => ({
    ...c,
    count: active.filter((d) => d.categoryId === c.id).length,
  }))
  const uncategorized = active.filter((d) => !d.categoryId).length

  const match = (d: (typeof all)[number]) => {
    if (!cat || cat === 'all') return true
    if (cat === 'none') return !d.categoryId
    return d.categoryId === cat
  }
  // 点菜热度统计（菜品维度：次数 + 最近一次点的日期）
  const orderRows = db
    .select({
      dishId: orders.dishId,
      c: sql<number>`count(*)`,
      last: sql<string | null>`max(${mealsTable.date})`,
    })
    .from(orders)
    .innerJoin(mealsTable, eq(orders.mealId, mealsTable.id))
    .groupBy(orders.dishId)
    .all()
  const statOf = new Map(orderRows.map((r) => [r.dishId, r]))
  const totalOrders = orderRows.reduce((sum, r) => sum + r.c, 0)
  const todayStr = todayLocal(tz)

  const hotItems = active
    .filter((d) => statOf.get(d.id))
    .sort((a, b) => (statOf.get(b.id)?.c ?? 0) - (statOf.get(a.id)?.c ?? 0))
    .slice(0, 3)
    .map((d) => ({
      name: d.name,
      meta: t('dishes.insights.times', { n: statOf.get(d.id)?.c ?? 0 }),
    }))

  const staleItems = active
    .filter((d) => {
      const last = statOf.get(d.id)?.last
      return !!last && dayjs(todayStr).diff(dayjs(last), 'day') >= 14
    })
    .sort(
      (a, b) =>
        dayjs(statOf.get(a.id)!.last!).valueOf() -
        dayjs(statOf.get(b.id)!.last!).valueOf(),
    )
    .slice(0, 3)
    .map((d) => ({
      name: d.name,
      meta: t('dishes.insights.days', {
        n: dayjs(todayStr).diff(dayjs(statOf.get(d.id)!.last!), 'day'),
      }),
    }))

  const neverCount = active.filter((d) => !statOf.get(d.id)).length

  const insightCards: InsightCard[] =
    totalOrders > 0
      ? [
          ...(hotItems.length
            ? [
                {
                  kind: 'hot' as const,
                  label: t('dishes.insights.hot'),
                  items: hotItems,
                },
              ]
            : []),
          ...(staleItems.length
            ? [
                {
                  kind: 'stale' as const,
                  label: t('dishes.insights.stale'),
                  items: staleItems,
                },
              ]
            : []),
          ...(neverCount > 0
            ? [
                {
                  kind: 'never' as const,
                  label: t('dishes.insights.never'),
                  items: [
                    {
                      name: t('dishes.insights.dishes', { n: neverCount }),
                    },
                  ],
                },
              ]
            : []),
        ]
      : []

  const activeView = active.filter(match)
  const archivedView = archived.filter(match)

  return (
    <>
      <PageHeader
        title={t('dishes.title')}
        subtitle={t('dishes.count', { n: active.length })}
        action={
          <div className="flex items-center gap-2">
            <DishIo />
            <DishForm mode="create" categories={categories}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                {t('common.add')}
              </Button>
            </DishForm>
          </div>
        }
      />

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={<ChefHat />}
          title={t('dishes.emptyTitle')}
          description={t('dishes.emptyDesc')}
          action={
            <DishForm mode="create" categories={categories}>
              <Button>
                <Plus className="h-4 w-4" />
                {t('dishes.addFirst')}
              </Button>
            </DishForm>
          }
        />
      ) : (
        <>
          <CategoryBar
            categories={categoriesWithCount}
            total={active.length}
            uncategorized={uncategorized}
          />

          {(!cat || cat === 'all') && insightCards.length > 0 && (
            <DishInsights cards={insightCards} />
          )}

          {activeView.length === 0 && archivedView.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title={t('dishes.noMatchTitle')}
              description={t('dishes.noMatchDesc')}
            />
          ) : (
            <DishesBrowser
              active={activeView.map((d) => ({
                ...d,
                editable: canManage(d.createdBy),
              }))}
              archived={archivedView.map((d) => ({
                ...d,
                editable: canManage(d.createdBy),
              }))}
              categories={categories}
              categoryNames={Object.fromEntries(categoryName)}
            />
          )}
        </>
      )}
    </>
  )
}
