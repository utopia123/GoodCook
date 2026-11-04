import { Plus, ChefHat, SearchX, FolderPlus } from 'lucide-react'
import { asc, desc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { dishes as dishesTable, dishCategories } from '@/lib/db/schema'
import { requireUser } from '@/lib/auth/user'
import { getT } from '@/lib/i18n/server'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { DishCard } from '@/components/dishes/dish-card'
import { DishForm } from '@/components/dishes/dish-form'
import { CategoryBar } from '@/components/dishes/category-bar'
import { CategoryAssign } from '@/components/dishes/category-assign'
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
  const activeView = active.filter(match)
  const archivedView = archived.filter(match)
  // 当前正在查看某个具体分类（用于「选择菜品加入」）
  const currentCategory = categories.find((c) => c.id === cat)

  const cardOf = (dish: (typeof all)[number], dimmed?: boolean) => {
    const node = (
      <DishCard
        dish={dish}
        dimmed={dimmed}
        categoryName={dish.categoryId ? (categoryName.get(dish.categoryId) ?? null) : null}
      />
    )
    return canManage(dish.createdBy) ? (
      <DishForm key={dish.id} mode="edit" dish={dish} categories={categories}>
        {node}
      </DishForm>
    ) : (
      <div key={dish.id}>{node}</div>
    )
  }

  return (
    <>
      <PageHeader
        title={t('dishes.title')}
        subtitle={t('dishes.count', { n: active.length })}
        action={
          <div className="flex items-center gap-2">
            <DishIo />
            {currentCategory && (
              <CategoryAssign
                category={currentCategory}
                dishes={active.map((d) => ({
                  id: d.id,
                  name: d.name,
                  categoryId: d.categoryId,
                }))}
                categoryName={(id: string | null) =>
                  id ? (categoryName.get(id) ?? null) : null
                }
              >
                <Button variant="trough" size="sm">
                  <FolderPlus className="h-4 w-4" />
                  {t('dishes.assign')}
                </Button>
              </CategoryAssign>
            )}
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

          {activeView.length === 0 && archivedView.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title={t('dishes.noMatchTitle')}
              description={t('dishes.noMatchDesc')}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 md:gap-4">
                {activeView.map((dish) => cardOf(dish))}
              </div>

              {archivedView.length > 0 && (
                <>
                  <p className="mb-3 mt-7 text-sm font-medium text-secondary">
                    {t('dishes.archived')}
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 md:gap-4">
                    {archivedView.map((dish) => cardOf(dish, true))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
