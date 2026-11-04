'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check, Soup } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'
import { toggleOrder } from '@/lib/actions/meals'
import type { Dish } from '@/lib/db/schema'

export function OrderPicker({
  mealId,
  dishes,
  categories = [],
  initialSelected,
}: {
  mealId: string
  dishes: Dish[]
  categories?: { id: string; name: string }[]
  initialSelected: string[]
}) {
  const router = useRouter()
  const t = useT()
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected),
  )
  const [activeTag, setActiveTag] = useState('')
  const [activeCat, setActiveCat] = useState('')
  const [, startTransition] = useTransition()
  const [error, setError] = useState('')

  // 全部菜品里出现过的标签（去重，不过滤上限——筛选必须全）
  const allTags = Array.from(new Set(dishes.flatMap((d) => d.tags ?? [])))
  // 只在有菜的分类才展示
  const shownCats = categories.filter((c) =>
    dishes.some((d) => d.categoryId === c.id),
  )
  const hasUncategorized = dishes.some((d) => !d.categoryId)

  const visible = dishes.filter((d) => {
    if (activeCat === 'none' && d.categoryId) return false
    if (activeCat && activeCat !== 'none' && d.categoryId !== activeCat)
      return false
    if (activeTag && !(d.tags ?? []).includes(activeTag)) return false
    return true
  })

  const toggle = (dishId: string) => {
    const next = new Set(selected)
    const wasSelected = next.has(dishId)
    if (wasSelected) next.delete(dishId)
    else next.add(dishId)
    setSelected(next)
    setError('')

    startTransition(async () => {
      const res = await toggleOrder(mealId, dishId)
      if (!res.ok) {
        // 回滚
        setSelected((cur) => {
          const back = new Set(cur)
          if (wasSelected) back.add(dishId)
          else back.delete(dishId)
          return back
        })
        setError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  if (dishes.length === 0) {
    return (
      <p className="rounded-2xl mf-inset p-4 text-center text-sm text-secondary">
        {t('picker.empty')}
      </p>
    )
  }

  return (
    <div>
      {(shownCats.length > 0 || hasUncategorized) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCat('')}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm',
              !activeCat
                ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                : 'mf-inset text-secondary hover:text-ink',
            )}
          >
            {t('dishes.all')}
          </button>
          {shownCats.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(activeCat === cat.id ? '' : cat.id)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm',
                activeCat === cat.id
                  ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                  : 'mf-inset text-secondary hover:text-ink',
              )}
            >
              {cat.name}
            </button>
          ))}
          {hasUncategorized && (
            <button
              type="button"
              onClick={() => setActiveCat(activeCat === 'none' ? '' : 'none')}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm',
                activeCat === 'none'
                  ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                  : 'mf-inset text-secondary hover:text-ink',
              )}
            >
              {t('dishes.uncategorized')}
            </button>
          )}
        </div>
      )}
      {allTags.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTag('')}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm',
              !activeTag
                ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                : 'mf-inset text-secondary hover:text-ink',
            )}
          >
            {t('dishes.all')}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm',
                activeTag === tag
                  ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                  : 'mf-inset text-secondary hover:text-ink',
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      {visible.length === 0 ? (
        <p className="mf-inset rounded-2xl p-4 text-center text-sm text-secondary">
          {t('picker.noMatch')}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {visible.map((dish) => {
          const on = selected.has(dish.id)
          return (
            <button
              key={dish.id}
              type="button"
              onClick={() => toggle(dish.id)}
              className={cn(
                'mf-raised mf-pressable relative overflow-hidden p-0 transition-shadow',
                on && 'ring-2 ring-accent ring-offset-2 ring-offset-base',
              )}
            >
              <div className="relative aspect-square w-full">
                {dish.imagePath ? (
                  <Image
                    src={`/api/uploads/${dish.imagePath}`}
                    alt={dish.name}
                    fill
                    sizes="120px"
                    className={cn('object-cover transition-transform', on && 'scale-[1.03]')}
                  />
                ) : (
                  <div className="mf-img-empty flex h-full w-full items-center justify-center">
                    <Soup className="h-7 w-7 text-accent/35" strokeWidth={1.5} />
                  </div>
                )}
                {on && (
                  <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent-strong text-white">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="relative truncate px-2 py-2 text-xs font-semibold tracking-[-0.01em] text-ink">
                {dish.name}
              </p>
            </button>
          )
        })}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  )
}
