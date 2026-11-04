'use server'

import { revalidatePath } from 'next/cache'
import { eq, inArray, sql } from 'drizzle-orm'
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

// ── 批量归类：把选中的菜品移入某个分类 ──

export async function assignDishesToCategory(
  categoryId: string | null,
  dishIds: string[],
): Promise<ActionResult & { moved?: number }> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }

  // null = 移出分类（归为未分类）
  if (categoryId) {
    const cat = db
      .select()
      .from(dishCategories)
      .where(eq(dishCategories.id, categoryId))
      .get()
    if (!cat) return { ok: false, error: t('err.categoryNotFound') }
  }

  const ids = [...new Set(dishIds.filter(Boolean))].slice(0, 500)
  if (ids.length === 0) return { ok: true, moved: 0 }

  db.update(dishes)
    .set({ categoryId })
    .where(inArray(dishes.id, ids))
    .run()

  revalidatePath('/dishes')
  return { ok: true, moved: ids.length }
}

// ── 导入（菜品页上传 JSON 或 zip 备份） ──

const importSchema = z.object({
  // 兼容两个品牌标识：gancook（原版导出）与 goodcook（本版导出）
  app: z.enum(['gancook', 'goodcook']),
  type: z.literal('dishes'),
  categories: z.array(z.string().trim().min(1).max(20)).max(100).default([]),
  dishes: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(30),
        description: z.string().max(200).nullish(),
        tags: z.array(z.string().trim().min(1).max(20)).max(6).default([]),
        category: z.string().trim().min(1).max(20).nullish(),
        // zip 备份会带图片文件，JSON 导入忽略此字段
        imagePath: z
          .string()
          .trim()
          .max(120)
          .refine((p) => p.startsWith('dishes/'), 'invalid image path')
          .optional(),
      }),
    )
    .max(1000),
})

type ImportPayload = z.infer<typeof importSchema>

export type ImportResult = {
  ok: boolean
  error?: string
  imported?: number
  skipped?: number
  categoriesAdded?: number
  imagesRestored?: number
}

/** 导入核心：分类幂等补建 + 同名跳过 + 可选图片落盘 */
async function runImport(
  t: TFn,
  meId: string,
  data: ImportPayload,
  getImage: (imagePath: string) => Promise<Buffer | null>,
): Promise<ImportResult> {
  const { mkdir, writeFile } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const { UPLOAD_DIR } = await import('@/lib/env')

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

  // 菜品：同名（任何状态）跳过，其余插入
  let imported = 0
  let skipped = 0
  let imagesRestored = 0
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

    // 图片落盘（仅 zip 备份提供文件流）
    let imagePath: string | null = null
    if (d.imagePath) {
      const buf = await getImage(d.imagePath)
      if (buf) {
        const ext = (d.imagePath.split('.').pop() || 'webp').toLowerCase()
        const safeExt = ['webp', 'jpg', 'jpeg', 'png'].includes(ext)
          ? ext
          : 'webp'
        const filename = `${crypto.randomUUID()}.${safeExt}`
        await mkdir(join(UPLOAD_DIR, 'dishes'), { recursive: true })
        await writeFile(join(UPLOAD_DIR, 'dishes', filename), buf)
        imagePath = `dishes/${filename}`
        imagesRestored++
      }
    }

    db.insert(dishes)
      .values({
        name: d.name,
        description: d.description?.trim() || null,
        tags: d.tags ?? [],
        categoryId: d.category ? (catId.get(d.category) ?? null) : null,
        imagePath,
        createdBy: meId,
      })
      .run()
    imported++
  }

  revalidatePath('/dishes')
  return { ok: true, imported, skipped, categoriesAdded, imagesRestored }
}

function parseImportPayload(raw: string):
  | { data: ImportPayload }
  | { error: string } {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { error: 'err.importInvalid' }
  }
  const parsed = importSchema.safeParse(json)
  if (!parsed.success) return { error: 'err.importInvalid' }
  return { data: parsed.data }
}

/** JSON 导入（不含图片） */
export async function importDishes(raw: string): Promise<ImportResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  const parsed = parseImportPayload(raw)
  if ('error' in parsed) return { ok: false, error: t(parsed.error) }
  return runImport(t, me.id, parsed.data, async () => null)
}

/** zip 备份导入（dishes.json + images/ 图片文件） */
export async function importDishesZip(form: FormData): Promise<ImportResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: t('err.importInvalid') }
  }

  const JSZip = (await import('jszip')).default
  let zip: Awaited<ReturnType<typeof JSZip.loadAsync>>
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer())
  } catch {
    return { ok: false, error: t('err.importInvalid') }
  }
  const jsonFile = zip.file('dishes.json')
  if (!jsonFile) return { ok: false, error: t('err.importInvalid') }

  const parsed = parseImportPayload(await jsonFile.async('string'))
  if ('error' in parsed) return { ok: false, error: t(parsed.error) }

  return runImport(t, me.id, parsed.data, async (imagePath) => {
    const entry = zip.file(`images/${imagePath}`)
    return entry ? entry.async('nodebuffer') : null
  })
}
