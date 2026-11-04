'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/user'
import { getT } from '@/lib/i18n/server'
import { setInsightCount } from '@/lib/settings'

export type PrefResult = { ok: true } | { ok: false; error: string }

/** 洞察显示条数（全家共用一份设置） */
export async function saveInsightCount(n: number): Promise<PrefResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  if (!Number.isFinite(n) || n < 2 || n > 10) {
    return { ok: false, error: t('err.invalidValue') }
  }
  setInsightCount(Math.round(n))
  revalidatePath('/dishes')
  revalidatePath('/me')
  revalidatePath('/home')
  return { ok: true }
}
