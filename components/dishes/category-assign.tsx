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
 * 「选择菜品加入此分类」：勾选菜品批量移入当前分类。
 * 已在当前分类的显示为已加入（不可反选）。
 */
export function CategoryAssign({
  category,
  dishes,
  categoryName,
  children,
}: {
  category: { id: string; name: string }
  dishes: PickDish[]
  categoryName: (id: string | null) => string | null
  children: React.ReactNode
}) {
  const router = useRouter()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const candidates = useMemo(
    () => dishes.filter((d) => d.categoryId !== category.id),
    [dishes, category.id],
  )
  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    return k ? candidates.filter((d) => d.name.toLowerCase().includes(k)) : candidates
  }, [candidates, q])

  const toggle = (id: string) =>
    setPicked((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const submit = () =>
    startTransition(async () => {
      setError('')
      const res = await assignDishesToCategory(category.id, [...picked])
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
        if (!v) {
          setPicked(new Set())
          setQ('')
          setError('')
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent title={t('dishes.assignTitle', { name: category.name })}>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <Input
              className="pl-9"
              placeholder={t('dishes.assignSearch')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-secondary">
              {t('dishes.assignEmpty')}
            </p>
          ) : (
            <ul className="max-h-[55vh] space-y-1.5 overflow-y-auto pr-0.5">
              {list.map((d) => {
                const on = picked.has(d.id)
                const current = categoryName(d.categoryId)
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
              ? t('dishes.assignConfirm', { n: picked.size })
              : t('dishes.assignConfirmEmpty')}
          </Button>
          <DialogClose className="sr-only">{t('common.cancel')}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
