'use server'

import { getCurrentUser } from '@/lib/auth/user'
import { getT } from '@/lib/i18n/server'
import { createBackup } from '@/lib/backup'
import { setBackupConfig } from '@/lib/settings'

export type BackupResult = { ok: true; name: string } | { ok: false; error: string }

/** 管理员手动触发一次备份（自动备份由调度器每天执行） */
export async function runBackupNow(): Promise<BackupResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  if (!me.isAdmin) return { ok: false, error: t('err.adminOnly') }
  try {
    const f = await createBackup()
    return { ok: true, name: f.name }
  } catch (e) {
    console.error('[backup] 手动备份失败', e)
    return { ok: false, error: t('backup.failed') }
  }
}


/** 保存备份设置（时间 + 保留份数） */
export async function saveBackupSettings(form: FormData): Promise<BackupResult> {
  const t = await getT()
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: t('err.loginRequired') }
  if (!me.isAdmin) return { ok: false, error: t('err.adminOnly') }

  const time = String(form.get('time') ?? '').trim()
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return { ok: false, error: t('backup.invalidTime') }
  }
  const rawKeep = Number(String(form.get('keep') ?? '').trim())
  if (!Number.isFinite(rawKeep) || rawKeep < 1 || rawKeep > 30) {
    return { ok: false, error: t('backup.invalidKeep') }
  }
  setBackupConfig(time, Math.round(rawKeep))
  return { ok: true, name: `${time} / ${Math.round(rawKeep)}` }
}
