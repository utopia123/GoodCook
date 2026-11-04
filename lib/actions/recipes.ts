'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { recipes } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/user'
import { getT, type TFn } from '@/lib/i18n/server'
import type { ActionResult } from './dishes'

const DIFFICULTY = ['easy', 'medium', 'hard'] as const
type Difficulty = (typeof DIFFICULTY)[number]

type RecipeFields = {
  title: string
  ingredients: string
  steps: string
  minutes: number | null
  difficulty: Difficulty
}

function readFields(form: FormData, t: TFn): RecipeFields | { error: string } {
  const title = String(form.get('title') ?? '').trim()
  if (!title) return { error: t('err.recipeTitleRequired') }
  if (title.length > 40) return { error: t('err.recipeTitleTooLong') }

  const ingredients = String(form.get('ingredients') ?? '').trim().slice(0, 2000)
  const steps = String(form.get('steps') ?? '').trim().slice(0, 4000)
  const rawMinutes = Number(String(form.get('minutes') ?? '').trim())
  const minutes =
    Number.isFinite(rawMinutes) && rawMinutes > 0 && rawMinutes <= 999
      ? Math.round(rawMinutes)
      : null
  const rawDiff = String(form.get('difficulty') ?? 'easy')
  const difficulty: Difficulty = (DIFFICULTY as readonly string[]).includes(
    rawDiff,
  )
    ? (rawDiff as Difficulty)
    : 'easy'

  return { title, ingredients, steps, minutes, difficulty }
}

export async function createRecipe(form: FormData): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  const f = readFields(form, t)
  if ('error' in f) return { ok: false, error: f.error }
  db.insert(recipes).values({ ...f, createdBy: me.id }).run()
  revalidatePath('/recipes')
  return { ok: true }
}

export async function updateRecipe(
  id: string,
  form: FormData,
): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  const f = readFields(form, t)
  if ('error' in f) return { ok: false, error: f.error }
  db.update(recipes).set(f).where(eq(recipes.id, id)).run()
  revalidatePath('/recipes')
  return { ok: true }
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  db.delete(recipes).where(eq(recipes.id, id)).run()
  revalidatePath('/recipes')
  return { ok: true }
}
