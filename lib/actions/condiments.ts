'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { condiments } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/user'
import { getT, type TFn } from '@/lib/i18n/server'
import type { ActionResult } from './dishes'

const KINDS = ['aromatic', 'spice', 'seasoning'] as const
type Kind = (typeof KINDS)[number]

type CondimentFields = {
  name: string
  kind: Kind
  note: string | null
  effect: string | null
  goodWith: string | null
  avoidWith: string | null
}

function readFields(
  form: FormData,
  t: TFn,
): CondimentFields | { error: string } {
  const name = String(form.get('name') ?? '').trim()
  if (!name) return { error: t('err.condimentNameRequired') }
  if (name.length > 40) return { error: t('err.condimentNameTooLong') }
  const rawKind = String(form.get('kind') ?? 'seasoning')
  const kind: Kind = (KINDS as readonly string[]).includes(rawKind)
    ? (rawKind as Kind)
    : 'seasoning'
  const note = String(form.get('note') ?? '').trim().slice(0, 100) || null
  const effect = String(form.get('effect') ?? '').trim().slice(0, 200) || null
  const goodWith = String(form.get('goodWith') ?? '').trim().slice(0, 200) || null
  const avoidWith = String(form.get('avoidWith') ?? '').trim().slice(0, 200) || null
  return { name, kind, note, effect, goodWith, avoidWith }
}

export async function createCondiment(form: FormData): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  const f = readFields(form, t)
  if ('error' in f) return { ok: false, error: f.error }
  db.insert(condiments).values(f).run()
  revalidatePath('/condiments')
  return { ok: true }
}

export async function updateCondiment(
  id: string,
  form: FormData,
): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  const f = readFields(form, t)
  if ('error' in f) return { ok: false, error: f.error }
  db.update(condiments).set(f).where(eq(condiments.id, id)).run()
  revalidatePath('/condiments')
  return { ok: true }
}

export async function deleteCondiment(id: string): Promise<ActionResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  db.delete(condiments).where(eq(condiments.id, id)).run()
  revalidatePath('/condiments')
  return { ok: true }
}
