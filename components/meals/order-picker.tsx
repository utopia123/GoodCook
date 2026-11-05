'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check, Clock, Flame, Search, Soup } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'
import { toggleOrder } from '@/lib/actions/meals'
import type { Dish } from '@/lib/db/schema'

export function OrderPicker({
  mealId,
  dishes,
  categories = [],
  initialSelected,
  heat = [],
  suggestCount = 6,
}: {
  mealId: string
  dishes: Dish[]
  categories?: { id: string; name: string }[]
  initialSelected: string[]
  /** 菜品热度（次数与距今天数），用于「常点 / 久未吃」建议 */
  heat?: { id: string; count: number; daysAgo: number | null }[]
  suggestCount?: number
}) {
  const router = useRouter()
  const t = useT()
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected),
  )
  const [activeTag, setActiveTag] = useState('')
  const [activeCat, setActiveCat] = useState('')
  const [tagOpen, setTagOpen] = useState(false)
  const [tagQ, setTagQ] = useState('')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<Dish | null>(null)
  const [, startTransition] = useTransition()
  const [error, setError] = useState('')

  // 全部菜品里出现过的标签（去重），按使用频次排序后仅预览常用项
  const allTags = Array.from(new Set(dishes.flatMap((d) => d.tags ?? [])))
  const tagCount = new Map<string, number>()
  for (const d of dishes) {
    for (const tg of d.tags ?? []) tagCount.set(tg, (tagCount.get(tg) ?? 0) + 1)
  }
  const sortedTags = [...allTags].sort(
    (a, b) => (tagCount.get(b) ?? 0) - (tagCount.get(a) ?? 0),
  )
  const TAG_PREVIEW = 8
  const previewTags = sortedTags.slice(0, TAG_PREVIEW)
  const moreTags = sortedTags.slice(TAG_PREVIEW)
  const sheetTags = (
    tagQ.trim()
      ? sortedTags.filter((tg) => tg.toLowerCase().includes(tagQ.trim().toLowerCase()))
      : sortedTags
  )
  // 只在有菜的分类才展示
  const shownCats = categories.filter((c) =>
    dishes.some((d) => d.categoryId === c.id),
  )
  const hasUncategorized = dishes.some((d) => !d.categoryId)

  const keyword = q.trim().toLowerCase()
  const visible = dishes.filter((d) => {
    if (
      keyword &&
      !d.name.toLowerCase().includes(keyword) &&
      !(d.tags ?? []).some((tg) => tg.toLowerCase().includes(keyword))
    )
      return false
    if (activeCat === 'none' && d.categoryId) return false
    if (activeCat && activeCat !== 'none' && d.categoryId !== activeCat)
      return false
    if (activeTag && !(d.tags ?? []).includes(activeTag)) return false
    return true
  })

  const dishById = new Map(dishes.map((d) => [d.id, d]))
  const hotSuggest = heat
    .filter((h) => h.count > 0 && dishById.has(h.id))
    .sort((a, b) => b.count - a.count)
    .slice(0, suggestCount)
  const staleSuggest = heat
    .filter((h) => (h.daysAgo ?? 0) >= 14 && dishById.has(h.id))
    .sort((a, b) => (b.daysAgo ?? 0) - (a.daysAgo ?? 0))
    .slice(0, suggestCount)

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
      {/* 搜索 */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        <Input
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('picker.searchDish')}
        />
      </div>

      {/* 常点 / 久未吃：横向滑动，点开可查看并选择 */}
      {!keyword && (hotSuggest.length > 0 || staleSuggest.length > 0) && (
        <div className="mb-3.5 space-y-2.5">
          {[
            {
              key: 'hot' as const,
              label: t('picker.hotShort'),
              icon: <Flame className="h-3.5 w-3.5 text-danger" />,
              rows: hotSuggest,
            },
            {
              key: 'stale' as const,
              label: t('picker.staleShort'),
              icon: <Clock className="h-3.5 w-3.5 text-warn" />,
              rows: staleSuggest,
            },
          ].map((row) =>
            row.rows.length === 0 ? null : (
              <div key={row.key}>
                <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-secondary">
                  {row.icon}
                  {row.label}
                </p>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {row.rows.map((h) => {
                    const d = dishById.get(h.id)
                    if (!d) return null
                    const on = selected.has(d.id)
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setDetail(d)}
                        className={cn(
                          'mf-raised mf-pressable w-[124px] shrink-0 overflow-hidden text-left',
                          on && 'ring-2 ring-accent',
                        )}
                      >
                        <div className="relative aspect-[4/3] w-full">
                          {d.imagePath ? (
                            <Image
                              src={`/api/uploads/${d.imagePath}`}
                              alt={d.name}
                              fill
                              sizes="124px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="mf-img-empty flex h-full w-full items-center justify-center">
                              <Soup className="h-6 w-6 text-accent/35" />
                            </div>
                          )}
                          {on && (
                            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-strong text-white">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="relative p-2">
                          <p className="truncate text-xs font-medium text-ink">
                            {d.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-secondary">
                            {row.key === 'hot'
                              ? t('dishes.insights.times', { n: h.count })
                              : t('dishes.insights.days', { n: h.daysAgo ?? 0 })}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {(shownCats.length > 0 || hasUncategorized) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="shrink-0 pr-0.5 text-[11px] font-medium tracking-wide text-secondary">
            {t('picker.groupCategory')}
          </span>
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
          <span className="shrink-0 pr-0.5 text-[11px] font-medium tracking-wide text-secondary">
            {t('picker.groupTag')}
          </span>
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
          {(activeTag && !previewTags.includes(activeTag)
            ? [activeTag, ...previewTags]
            : previewTags
          ).map((tag) => (
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
              <span className="max-w-[9em] truncate">{tag}</span>
            </button>
          ))}
          {moreTags.length > 0 && (
            <Dialog open={tagOpen} onOpenChange={setTagOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium text-secondary transition-colors mf-inset hover:text-ink sm:px-4 sm:py-2 sm:text-sm"
                >
                  {t('picker.moreTags', { n: moreTags.length })}
                </button>
              </DialogTrigger>
              <DialogContent title={t('picker.moreTagsTitle')}>
                <div className="space-y-3">
                  <Input
                    value={tagQ}
                    onChange={(e) => setTagQ(e.target.value)}
                    placeholder={t('picker.searchTag')}
                  />
                  <div className="flex max-h-[52vh] flex-wrap gap-2 overflow-y-auto">
                    {sheetTags.length === 0 && (
                      <p className="py-6 text-center text-sm text-secondary">
                        {t('picker.noTag')}
                      </p>
                    )}
                    {sheetTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setActiveTag(activeTag === tag ? '' : tag)
                          setTagOpen(false)
                        }}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs transition-colors',
                          activeTag === tag
                            ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                            : 'mf-inset text-secondary hover:text-ink',
                        )}
                      >
                        {tag}
                        <span className="ml-1 opacity-60">
                          {tagCount.get(tag) ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
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

      {/* 菜品详情：查看并直接加入 */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent title={detail?.name ?? ''}>
          {detail && (
            <div className="space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
                {detail.imagePath ? (
                  <Image
                    src={`/api/uploads/${detail.imagePath}`}
                    alt={detail.name}
                    fill
                    sizes="(max-width: 640px) 90vw, 420px"
                    className="object-cover"
                  />
                ) : (
                  <div className="mf-img-empty flex h-full w-full items-center justify-center">
                    <Soup className="h-10 w-10 text-accent/35" />
                  </div>
                )}
              </div>
              {(detail.description || (detail.tags ?? []).length > 0) && (
                <p className="text-sm leading-relaxed text-secondary">
                  {detail.description ||
                    (detail.tags ?? []).map((tg) => `#${tg}`).join(' ')}
                </p>
              )}
              <Button
                className="w-full"
                variant={selected.has(detail.id) ? 'secondary' : 'primary'}
                onClick={() => toggle(detail.id)}
              >
                {selected.has(detail.id)
                  ? t('picker.removeFromMeal')
                  : t('picker.addToMeal')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
