'use server'

import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { dishes, dishCategories } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/user'
import { saveImage, deleteImage, fileToBuffer } from '@/lib/images'
import { getT, type TFn } from '@/lib/i18n/server'

export type ActionResult = { ok: true } | { ok: false; error: string }

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (!raw) return []
  return String(raw)
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6)
}

/** 分类 id：空串视为未分类 */
function readCategoryId(form: FormData): string | null {
  const raw = String(form.get('categoryId') ?? '').trim()
  return raw || null
}

/** 校验分类存在，返回 { id } 或 { error } */
function checkCategoryId(
  categoryId: string | null,
  t: TFn,
): { id: string | null } | { error: string } {
  if (!categoryId) return { id: null }
  const cat = db
    .select()
    .from(dishCategories)
    .where(eq(dishCategories.id, categoryId))
    .get()
  return cat ? { id: categoryId } : { error: t('err.categoryNotFound') }
}

function imageError(t: TFn, e: unknown): string {
  return (e as Error).message === 'IMAGE_TOO_LARGE'
    ? t('err.imageTooLarge')
    : t('err.imageOnly')
}

function readName(form: FormData, t: TFn): string | { error: string } {
  const name = String(form.get('name') ?? '').trim()
  if (!name) return { error: t('err.dishNameRequired') }
  if (name.length > 30) return { error: t('err.dishNameTooLong') }
  return name
}

export async function createDish(form: FormData): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }

  const name = readName(form, t)
  if (typeof name !== 'string') return { ok: false, error: name.error }

  const description = String(form.get('description') ?? '').trim().slice(0, 200) || null
  const tags = parseTags(form.get('tags'))

  let imagePath: string | null = null
  const file = form.get('image')
  if (file instanceof File && file.size > 0) {
    try {
      imagePath = await saveImage(await fileToBuffer(file), 'dishes')
    } catch (e) {
      return { ok: false, error: imageError(t, e) }
    }
  }

  const cat = checkCategoryId(readCategoryId(form), t)
  if ('error' in cat) return { ok: false, error: cat.error }

  db.insert(dishes)
    .values({ name, description, tags, imagePath, categoryId: cat.id, createdBy: me.id })
    .run()

  revalidatePath('/dishes')
  return { ok: true }
}

export async function updateDish(
  id: string,
  form: FormData,
): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  const dish = db.select().from(dishes).where(eq(dishes.id, id)).get()
  if (!dish) return { ok: false, error: t('err.dishNotFound') }
  if (dish.createdBy !== me.id && !me.isAdmin)
    return { ok: false, error: t('err.onlyOwnerDishEdit') }

  const name = readName(form, t)
  if (typeof name !== 'string') return { ok: false, error: name.error }

  const description = String(form.get('description') ?? '').trim().slice(0, 200) || null
  const tags = parseTags(form.get('tags'))

  let imagePath = dish.imagePath
  const file = form.get('image')
  if (file instanceof File && file.size > 0) {
    try {
      const newPath = await saveImage(await fileToBuffer(file), 'dishes')
      await deleteImage(dish.imagePath)
      imagePath = newPath
    } catch (e) {
      return { ok: false, error: imageError(t, e) }
    }
  }

  const cat = checkCategoryId(readCategoryId(form), t)
  if ('error' in cat) return { ok: false, error: cat.error }

  db.update(dishes)
    .set({ name, description, tags, imagePath, categoryId: cat.id })
    .where(eq(dishes.id, id))
    .run()

  revalidatePath('/dishes')
  return { ok: true }
}

export async function setDishStatus(
  id: string,
  status: 'active' | 'archived',
): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  db.update(dishes).set({ status }).where(eq(dishes.id, id)).run()
  revalidatePath('/dishes')
  return { ok: true }
}

export async function deleteDish(id: string): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  const dish = db.select().from(dishes).where(eq(dishes.id, id)).get()
  if (!dish) return { ok: true }
  if (dish.createdBy !== me.id && !me.isAdmin)
    return { ok: false, error: t('err.onlyOwnerDishDel') }
  await deleteImage(dish.imagePath)
  db.delete(dishes).where(eq(dishes.id, id)).run()
  revalidatePath('/dishes')
  return { ok: true }
}

// ── 导入（菜品页上传 JSON） ──

const importSchema = z.object({
  app: z.literal('gancook'),
  type: z.literal('dishes'),
  categories: z.array(z.string().trim().min(1).max(20)).max(100).default([]),
  dishes: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(30),
        description: z.string().max(200).nullish(),
        tags: z.array(z.string().trim().min(1).max(20)).max(6).default([]),
        category: z.string().trim().min(1).max(20).nullish(),
      }),
    )
    .max(1000),
})

export type ImportResult = {
  ok: boolean
  error?: string
  imported?: number
  skipped?: number
  categoriesAdded?: number
}

export async function importDishes(raw: string): Promise<ImportResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, error: t('err.importInvalid') }
  }
  const parsed = importSchema.safeParse(json)
  if (!parsed.success) return { ok: false, error: t('err.importInvalid') }
  const data = parsed.data

  // 分类按名称幂等补建
  const catId = new Map<string, string>()
  let categoriesAdded = 0
  const wanted = new Set<string>(data.categories)
  for (const d of data.dishes) if (d.category) wanted.add(d.category)
  for (const name of wanted) {
    const existing = db
      .select()
      .from(dishCategories)
      .where(eq(dishCategories.name, name))
      .get()
    if (existing) {
      catId.set(name, existing.id)
      continue
    }
    const created = crypto.randomUUID()
    const max = db
      .select({ m: sql<number>`coalesce(max(${dishCategories.sortOrder}), -1)` })
      .from(dishCategories)
      .get()
    db.insert(dishCategories)
      .values({ id: created, name, sortOrder: (max?.m ?? -1) + 1 })
      .run()
    catId.set(name, created)
    categoriesAdded++
  }

  // 菜品：同名（任何状态）跳过，其余插入（图片不随 JSON 迁移）
  let imported = 0
  let skipped = 0
  for (const d of data.dishes) {
    const dup = db
      .select()
      .from(dishes)
      .where(eq(dishes.name, d.name))
      .get()
    if (dup) {
      skipped++
      continue
    }
    db.insert(dishes)
      .values({
        name: d.name,
        description: d.description?.trim() || null,
        tags: d.tags ?? [],
        categoryId: d.category ? (catId.get(d.category) ?? null) : null,
        imagePath: null,
        createdBy: me.id,
      })
      .run()
    imported++
  }

  revalidatePath('/dishes')
  return { ok: true, imported, skipped, categoriesAdded }
}
