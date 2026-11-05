'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FolderInput, Plus, X } from 'lucide-react'
import { DishCard } from '@/components/dishes/dish-card'
import { DishForm } from '@/components/dishes/dish-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useT } from '@/components/i18n-provider'
import { assignDishesToCategory } from '@/lib/actions/dishes'
import { createCategory } from '@/lib/actions/categories'
import type { Dish, DishCategory } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

export type BrowserDish = Dish & { editable: boolean }

/**
 * 菜品网格 + 批量管理。
 * 进入批量模式后，卡片上出现勾选框；底部操作条选择目标分类（已有 / 未分类 / 新建），一次性移动。
 */
export function DishesBrowser({
  active,
  archived,
  categories,
  categoryNames,
}: {
  active: BrowserDish[]
  archived: BrowserDish[]
  categories: DishCategory[]
  categoryNames: Record<string, string>
}) {
  const router = useRouter()
  const t = useT()
  const [mode, setMode] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [target, setTarget] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [err, setErr] = useState('')
  const [pending, startTransition] = useTransition()

  const targetLabel = useMemo(() => {
    if (!target) return t('dishes.uncategorized')
    return categoryNames[target] ?? ''
  }, [target, categoryNames, t])

  const toggle = (id: string) =>
    setPicked((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const exit = () => {
    setMode(false)
    setPicked(new Set())
    setTarget('')
    setCreating(false)
    setNewName('')
    setErr('')
  }

  const move = () =>
    startTransition(async () => {
      setErr('')
      const res = await assignDishesToCategory(target || null, [...picked])
      if (!res.ok) return setErr(res.error)
      exit()
      router.refresh()
    })

  const createAndMove = () =>
    startTransition(async () => {
      setErr('')
      const name = newName.trim()
      if (!name) return setErr(t('err.categoryNameRequired'))
      const fd = new FormData()
      fd.set('name', name)
      const created = await createCategory(fd)
      if (!created.ok) return setErr(created.error)
      if (!created.id) return setErr(t('err.categoryNameRequired'))
      const res = await assignDishesToCategory(created.id, [...picked])
      if (!res.ok) return setErr(res.error)
      exit()
      router.refresh()
    })

  const card = (dish: BrowserDish, dimmed?: boolean) => {
    const node = (
      <DishCard
        dish={dish}
        dimmed={dimmed}
        categoryName={
          dish.categoryId ? (categoryNames[dish.categoryId] ?? null) : null
        }
      />
    )

    if (mode) {
      const on = picked.has(dish.id)
      return (
        <button
          key={dish.id}
          type="button"
          onClick={() => toggle(dish.id)}
          className={cn(
            'relative block w-full rounded-[var(--radius)] text-left transition-shadow',
            on && 'ring-2 ring-accent',
          )}
        >
          {node}
          <span
            className={cn(
              'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors',
              on
                ? 'border-accent bg-accent-strong text-white'
                : 'border-white/70 bg-black/25 text-transparent',
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        </button>
      )
    }

    return dish.editable ? (
      <DishForm key={dish.id} mode="edit" dish={dish} categories={categories}>
        {node}
      </DishForm>
    ) : (
      <div key={dish.id}>{node}</div>
    )
  }

  return (
    <>
      <div className="mb-3 mt-1 flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-sm text-secondary">
          {mode
            ? t('batch.selected', { n: picked.size })
            : t('batch.hint')}
        </p>
        <Button
          variant={mode ? 'secondary' : 'trough'}
          size="sm"
          onClick={() => (mode ? exit() : setMode(true))}
        >
          {mode ? <X className="h-4 w-4" /> : <FolderInput className="h-4 w-4" />}
          {mode ? t('batch.exit') : t('batch.manage')}
        </Button>
      </div>

      <div className="mf-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 md:gap-4">
        {active.map((dish) => card(dish))}
      </div>

      {archived.length > 0 && (
        <>
          <p className="mb-3 mt-7 text-sm font-medium text-secondary">
            {t('dishes.archived')}
          </p>
          <div className="mf-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 md:gap-4">
            {archived.map((dish) => card(dish, true))}
          </div>
        </>
      )}

      {/* 底部操作条 */}
      {mode && (
        <div className="sticky bottom-24 z-30 mt-4 space-y-2.5 rounded-2xl border border-[var(--mf-glass-border)] bg-[var(--mf-surface)] p-3 shadow-[0_10px_28px_rgb(var(--mf-shadow)/0.2)] lg:bottom-4">
          <p className="text-xs font-medium text-secondary">{t('batch.target')}</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setTarget(target === c.id ? '' : c.id)}
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
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors',
                creating
                  ? 'bg-accent/15 font-semibold text-accent ring-1 ring-accent/40'
                  : 'mf-inset text-secondary hover:text-ink',
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('batch.new')}
            </button>
          </div>

          {creating && (
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('batch.newPh')}
                maxLength={20}
                className="h-10 flex-1"
              />
              <Button
                size="sm"
                variant="trough"
                disabled={picked.size === 0}
                loading={pending}
                onClick={createAndMove}
              >
                {t('batch.createMove')}
              </Button>
            </div>
          )}

          {err && <p className="text-sm text-danger">{err}</p>}

          <Button
            className="w-full"
            disabled={picked.size === 0 || pending}
            loading={pending}
            onClick={move}
          >
            {picked.size > 0
              ? t('batch.moveTo', { n: picked.size, name: targetLabel })
              : t('batch.pickFirst')}
          </Button>
        </div>
      )}
    </>
  )
}
