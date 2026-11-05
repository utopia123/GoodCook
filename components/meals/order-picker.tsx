'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Check,
  Clock,
  Flame,
  Search,
  SlidersHorizontal,
  Soup,
  X,
} from 'lucide-react'
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
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<Dish | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
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
    .slice(0, Math.max(2, Math.round(suggestCount / 2)))
  const staleSuggest = heat
    .filter((h) => (h.daysAgo ?? 0) >= 14 && dishById.has(h.id))
    .sort((a, b) => (b.daysAgo ?? 0) - (a.daysAgo ?? 0))
    .slice(0, Math.max(2, Math.round(suggestCount / 2)))

  // 合并成一排：常点在前、久未吃在后，去重
  const seen = new Set<string>()
  const suggestRow: { h: (typeof heat)[number]; kind: 'hot' | 'stale' }[] = []
  for (const h of hotSuggest) {
    if (seen.has(h.id)) continue
    seen.add(h.id)
    suggestRow.push({ h, kind: 'hot' })
  }
  for (const h of staleSuggest) {
    if (seen.has(h.id)) continue
    seen.add(h.id)
    suggestRow.push({ h, kind: 'stale' })
  }

  const activeCount = (activeCat ? 1 : 0) + (activeTag ? 1 : 0)

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
      {/* 搜索 + 筛选入口 */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('picker.searchDish')}
          />
        </div>
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="mf-inset flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm text-secondary"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('picker.filter')}
              {activeCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-strong px-1 text-[10px] font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </DialogTrigger>
          <DialogContent title={t('picker.filterTitle')}>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-secondary">
                  {t('picker.groupCategory')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Chip active={!activeCat} onClick={() => setActiveCat('')}>
                    {t('dishes.all')}
                  </Chip>
                  {shownCats.map((c) => (
                    <Chip
                      key={c.id}
                      active={activeCat === c.id}
                      onClick={() =>
                        setActiveCat(activeCat === c.id ? '' : c.id)
                      }
                    >
                      {c.name}
                    </Chip>
                  ))}
                  {hasUncategorized && (
                    <Chip
                      active={activeCat === 'none'}
                      onClick={() =>
                        setActiveCat(activeCat === 'none' ? '' : 'none')
                      }
                    >
                      {t('dishes.uncategorized')}
                    </Chip>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-secondary">
                  {t('picker.groupTag')}
                </p>
                <div className="flex max-h-[38vh] flex-wrap gap-2 overflow-y-auto">
                  <Chip active={!activeTag} onClick={() => setActiveTag('')}>
                    {t('dishes.all')}
                  </Chip>
                  {sortedTags.map((tag) => (
                    <Chip
                      key={tag}
                      active={activeTag === tag}
                      onClick={() =>
                        setActiveTag(activeTag === tag ? '' : tag)
                      }
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 border-t border-[var(--mf-glass-border)] pt-3">
                <Button
                  variant="trough"
                  className="flex-1"
                  onClick={() => {
                    setActiveCat('')
                    setActiveTag('')
                  }}
                >
                  {t('picker.clearFilter')}
                </Button>
                <Button className="flex-1" onClick={() => setFilterOpen(false)}>
                  {t('common.done')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 已选筛选条件 */}
      {activeCount > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {activeCat && (
            <button
              type="button"
              onClick={() => setActiveCat('')}
              className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent"
            >
              {activeCat === 'none'
                ? t('dishes.uncategorized')
                : (categories.find((c) => c.id === activeCat)?.name ?? '')}
              <X className="h-3 w-3" />
            </button>
          )}
          {activeTag && (
            <button
              type="button"
              onClick={() => setActiveTag('')}
              className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent"
            >
              {activeTag}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* 推荐：常点与久未吃合并为一排 */}
      {!keyword && suggestRow.length > 0 && (
        <div className="mb-3">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:px-0">
            {suggestRow.map(({ h, kind }) => {
              const d = dishById.get(h.id)
              if (!d) return null
              const on = selected.has(d.id)
              return (
                <button
                  key={`${kind}-${h.id}`}
                  type="button"
                  onClick={() => setDetail(d)}
                  className={cn(
                    'mf-raised mf-pressable w-[116px] shrink-0 overflow-hidden text-left md:w-auto md:shrink',
                    on && 'ring-2 ring-accent',
                  )}
                >
                  <div className="relative aspect-[4/3] w-full">
                    {d.imagePath ? (
                      <Image
                        src={`/api/uploads/${d.imagePath}`}
                        alt={d.name}
                        fill
                        sizes="116px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="mf-img-empty flex h-full w-full items-center justify-center">
                        <Soup className="h-6 w-6 text-accent/35" />
                      </div>
                    )}
                    <span
                      className={cn(
                        'absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white',
                        kind === 'hot' ? 'bg-danger/85' : 'bg-black/45',
                      )}
                    >
                      {kind === 'hot' ? (
                        <Flame className="h-2.5 w-2.5" />
                      ) : (
                        <Clock className="h-2.5 w-2.5" />
                      )}
                      {kind === 'hot'
                        ? t('picker.hotShort')
                        : t('picker.staleShort')}
                    </span>
                    {on && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-strong text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="relative px-2 py-1.5">
                    <p className="truncate text-xs font-medium text-ink">
                      {d.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-secondary">
                      {kind === 'hot'
                        ? t('dishes.insights.times', { n: h.count })
                        : t('dishes.insights.days', { n: h.daysAgo ?? 0 })}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mf-inset rounded-2xl p-4 text-center text-sm text-secondary">
          {t('picker.noMatch')}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4">
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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-[13px] transition-colors',
        active
          ? 'border-accent/40 bg-accent/15 font-semibold text-accent'
          : 'border-[var(--mf-glass-border)] bg-[var(--mf-surface)] text-secondary',
      )}
    >
      {children}
    </button>
  )
}
