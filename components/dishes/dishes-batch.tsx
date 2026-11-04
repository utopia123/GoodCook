'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n-provider'
import { assignDishesToCategory } from '@/lib/actions/dishes'
import { cn } from '@/lib/utils'

export type PickDish = {
  id: string
  name: string
  categoryId: string | null
}

/**
 * 批量归类：勾选多道菜，选择目标分类（含「未分类」以移出）。
 * 默认目标为当前所在分类（若有）。
 */
export function DishesBatch({
  dishes,
  categories,
  defaultCategoryId,
  children,
}: {
  dishes: PickDish[]
  categories: { id: string; name: string }[]
  defaultCategoryId?: string | null
  children: React.ReactNode
}) {
  const router = useRouter()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<string>(defaultCategoryId ?? '')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const catName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    return k ? dishes.filter((d) => d.name.toLowerCase().includes(k)) : dishes
  }, [dishes, q])

  const toggle = (id: string) =>
    setPicked((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const reset = () => {
    setPicked(new Set())
    setQ('')
    setError('')
    setTarget(defaultCategoryId ?? '')
  }

  const submit = () =>
    startTransition(async () => {
      setError('')
      const res = await assignDishesToCategory(target || null, [...picked])
      if (!res.ok) {
        setError(res.error)
        return
      }
      setPicked(new Set())
      setOpen(false)
      router.refresh()
    })

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent title={t('batch.title')}>
        <div className="space-y-3">
          {/* 目标分类 */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-secondary">
              {t('batch.target')}
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTarget(c.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs transition-colors',
                    target === c.id
                      ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                      : 'mf-inset text-secondary hover:text-ink',
                  )}
                >
                  {c.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTarget('')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs transition-colors',
                  target === ''
                    ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                    : 'mf-inset text-secondary hover:text-ink',
                )}
              >
                {t('dishes.uncategorized')}
              </button>
            </div>
          </div>

          {/* 搜索 */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <Input
              className="pl-9"
              placeholder={t('batch.search')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* 菜品多选 */}
          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-secondary">
              {t('batch.empty')}
            </p>
          ) : (
            <ul className="max-h-[52vh] space-y-1.5 overflow-y-auto pr-0.5">
              {list.map((d) => {
                const on = picked.has(d.id)
                const current = d.categoryId ? catName.get(d.categoryId) : null
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => toggle(d.id)}
                      className={cn(
                        'mf-inset flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
                        on && 'ring-1 ring-accent/50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                          on
                            ? 'border-accent bg-accent-strong text-white'
                            : 'border-secondary/40',
                        )}
                      >
                        {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-ink">
                          {d.name}
                        </span>
                        {current && (
                          <span className="block truncate text-xs text-secondary">
                            {current}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            className="w-full"
            size="lg"
            loading={pending}
            disabled={picked.size === 0}
            onClick={submit}
          >
            {picked.size > 0
              ? t('batch.confirm', {
                  n: picked.size,
                  name: target ? (catName.get(target) ?? '') : t('dishes.uncategorized'),
                })
              : t('batch.confirmEmpty')}
          </Button>
          <DialogClose className="sr-only">{t('common.cancel')}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
