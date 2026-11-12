'use server'

import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { dishCategories } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/user'
import { getT, type TFn } from '@/lib/i18n/server'
import type { ActionResult } from './dishes'

export type CategoryActionResult = ActionResult & { id?: string }

function readCategoryName(form: FormData, t: TFn): string | { error: string } {
  const name = String(form.get('name') ?? '').trim()
  if (!name) return { error: t('err.categoryNameRequired') }
  if (name.length > 20) return { error: t('err.categoryNameTooLong') }
  return name
}

/**
 * 按名称查找分类，不存在则创建（幂等）。
 * 供页面动作与导入复用；已存在时直接返回既有 id。
 */
export async function ensureCategory(name: string): Promise<CategoryActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  const clean = name.trim()
  if (!clean) return { ok: false, error: t('err.categoryNameRequired') }
  if (clean.length > 20) return { ok: false, error: t('err.categoryNameTooLong') }

  const existing = db
    .select()
    .from(dishCategories)
    .where(eq(dishCategories.name, clean))
    .get()
  if (existing) return { ok: true, id: existing.id }

  const max = db
    .select({ m: sql<number>`coalesce(max(${dishCategories.sortOrder}), -1)` })
    .from(dishCategories)
    .get()
  const id = crypto.randomUUID()
  db.insert(dishCategories)
    .values({ id, name: clean, sortOrder: (max?.m ?? -1) + 1 })
    .run()
  revalidatePath('/dishes')
  return { ok: true, id }
}

export async function createCategory(form: FormData): Promise<CategoryActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  const name = readCategoryName(form, t)
  if (typeof name !== 'string') return { ok: false, error: name.error }
  return ensureCategory(name)
}

export async function renameCategory(
  id: string,
  form: FormData,
): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  const name = readCategoryName(form, t)
  if (typeof name !== 'string') return { ok: false, error: name.error }

  const dup = db
    .select()
    .from(dishCategories)
    .where(eq(dishCategories.name, name))
    .get()
  if (dup && dup.id !== id) return { ok: false, error: t('err.categoryExists') }

  db.update(dishCategories).set({ name }).where(eq(dishCategories.id, id)).run()
  revalidatePath('/dishes')
  return { ok: true }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  // 菜品的 category_id 由外键 ON DELETE SET NULL 自动归为未分类
  db.delete(dishCategories).where(eq(dishCategories.id, id)).run()
  revalidatePath('/dishes')
  return { ok: true }
}

