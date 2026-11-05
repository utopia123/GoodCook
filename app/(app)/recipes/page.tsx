import { Plus, BookOpen, Clock } from 'lucide-react'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { recipes } from '@/lib/db/schema'
import { requireUser } from '@/lib/auth/user'
import { getT } from '@/lib/i18n/server'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { RecipeForm } from '@/components/recipes/recipe-form'

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  await requireUser()
  const t = await getT()
  const all = db.select().from(recipes).orderBy(desc(recipes.createdAt)).all()

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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
