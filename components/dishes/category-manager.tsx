'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n-provider'
import {
  createCategory,
  renameCategory,
  deleteCategory,
} from '@/lib/actions/categories'
import type { DishCategory } from '@/lib/db/schema'

/** 分类管理：增、改名、删除（删除后其下菜品自动归为未分类） */
export function CategoryManager({
  categories,
  children,
}: {
  categories: DishCategory[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError('')
      const res = await fn()
      if (res.ok) {
        setNewName('')
        setEditingId(null)
        setEditingName('')
        router.refresh()
      } else {
        setError(res.error ?? '')
      }
    })

  const add = () => {
    if (!newName.trim()) return
    const form = new FormData()
    form.set('name', newName)
    run(() => createCategory(form))
  }

  const rename = () => {
    if (!editingId || !editingName.trim()) return
    const form = new FormData()
    form.set('name', editingName)
    run(() => renameCategory(editingId, form))
  }

  const remove = (cat: DishCategory) => {
    if (!confirm(t('dishes.catDelConfirm', { name: cat.name }))) return
    run(() => deleteCategory(cat.id))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent title={t('dishes.catMgrTitle')}>
        <div className="space-y-3">
          {/* 新增 */}
          <div className="flex gap-2">
            <Input
              placeholder={t('dishes.catAddPh')}
              value={newName}
              maxLength={20}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <Button size="sm" loading={pending} onClick={add} className="shrink-0">
              <Plus className="h-4 w-4" />
              {t('dishes.catAdd')}
            </Button>
          </div>

          {/* 列表 */}
          {categories.length === 0 ? (
            <p className="py-4 text-center text-sm text-secondary">
              {t('dishes.catEmpty')}
            </p>
          ) : (
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="mf-inset flex items-center gap-2 rounded-xl px-3 py-2"
                >
                  {editingId === cat.id ? (
                    <>
                      <Input
                        value={editingName}
                        maxLength={20}
                        className="h-9 flex-1"
                        autoFocus
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && rename()}
                      />
                      <Button size="sm" loading={pending} onClick={rename}>
                        {t('common.save')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-[15px] text-ink">
                        {cat.name}
                      </span>
                      <button
                        type="button"
                        className="p-1.5 text-secondary hover:text-ink"
                        aria-label={t('dishes.catRename')}
                        onClick={() => {
                          setEditingId(cat.id)
                          setEditingName(cat.name)
                          setError('')
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-secondary hover:text-danger"
                        aria-label={t('common.delete')}
                        onClick={() => remove(cat)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
          <DialogClose className="sr-only">{t('common.cancel')}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
