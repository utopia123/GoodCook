import { Plus, BookOpen, Clock } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { dishCategories, dishes, recipes } from '@/lib/db/schema'
import { requireUser } from '@/lib/auth/user'
import { getT } from '@/lib/i18n/server'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { RecipeForm } from '@/components/recipes/recipe-form'
import { DishRoulette } from '@/components/recipes/dish-roulette'

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  await requireUser()
  const t = await getT()
  const all = db.select().from(recipes).orderBy(desc(recipes.createdAt)).all()

  // 配菜转盘的候选：在用的菜品，剔除主食（米饭面条不该占「几菜」的名额）
  const soupCategories = new Set(
    db
      .select({ id: dishCategories.id, name: dishCategories.name })
      .from(dishCategories)
      .all()
      .filter((c) => c.name.includes('汤'))
      .map((c) => c.id),
  )
  const candidates = db
    .select({
      id: dishes.id,
      name: dishes.name,
      tags: dishes.tags,
      categoryId: dishes.categoryId,
    })
    .from(dishes)
    .where(eq(dishes.status, 'active'))
    .all()
    .filter((d) => !(d.tags ?? []).includes('主食'))
    .map((d) => ({
      id: d.id,
      name: d.name,
      soup:
        (d.tags ?? []).includes('汤') ||
        (d.categoryId ? soupCategories.has(d.categoryId) : false) ||
        d.name.includes('汤'),
    }))

  return (
    <>
      <PageHeader
        title={t('recipes.title')}
        subtitle={t('recipes.count', { n: all.length })}
        action={
          <RecipeForm mode="create">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {t('common.add')}
            </Button>
          </RecipeForm>
        }
      />

      <DishRoulette dishes={candidates} />

      {all.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={t('recipes.emptyTitle')}
          description={t('recipes.emptyDesc')}
          action={
            <RecipeForm mode="create">
              <Button>
                <Plus className="h-4 w-4" />
                {t('recipes.addFirst')}
              </Button>
            </RecipeForm>
          }
        />
      ) : (
        <div className="mf-stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {all.map((r) => (
            <RecipeForm key={r.id} mode="edit" recipe={r}>
              <button
                type="button"
                className="mf-raised mf-pressable w-full p-4 text-left"
              >
                <h3 className="truncate text-base font-semibold text-ink">
                  {r.title}
                </h3>
                <p className="mt-1.5 flex items-center gap-2 text-[13px] text-secondary">
                  {r.minutes ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t('recipes.minutesShort', { n: r.minutes })}
                    </span>
                  ) : null}
                  <span>{t(`recipes.diff.${r.difficulty}`)}</span>
                </p>
                {r.ingredients && (
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-secondary">
                    {r.ingredients.replace(/\n/g, ' · ')}
                  </p>
                )}
              </button>
            </RecipeForm>
          ))}
        </div>
      )}
    </>
  )
}
