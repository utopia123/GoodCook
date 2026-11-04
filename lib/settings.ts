import 'server-only'
import { db } from '@/lib/db/client'
import { settings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { TIMEZONE } from '@/lib/env'

export type FamilySettings = {
  familyName: string
  joinCode: string
  registrationOpen: boolean
  timezone: string
}

const DEFAULTS: FamilySettings = {
  familyName: '我家',
  joinCode: '',
  registrationOpen: true,
  timezone: TIMEZONE,
}

export function getSetting(key: string): string | null {
  const row = db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .get()
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run()
}

export function getSettings(): FamilySettings {
  const rows = db.select().from(settings).all()
  const map = new Map(rows.map((r) => [r.key, r.value ?? '']))
  return {
    familyName: map.get('familyName') || DEFAULTS.familyName,
    joinCode: map.get('joinCode') ?? DEFAULTS.joinCode,
    registrationOpen:
      (map.get('registrationOpen') ?? '1') === '1',
    timezone: map.get('timezone') || DEFAULTS.timezone,
  }
}


// ── 备份配置（我的页可改） ──
export type BackupConfig = { time: string; keep: number }

export function getBackupConfig(): BackupConfig {
  const time = getSetting('backupTime') ?? '03:00'
  const rawKeep = Number(getSetting('backupKeep') ?? '5')
  const keep = Number.isFinite(rawKeep)
    ? Math.min(30, Math.max(1, Math.round(rawKeep)))
    : 5
  return { time: /^\d{2}:\d{2}$/.test(time) ? time : '03:00', keep }
}

export function setBackupConfig(time: string, keep: number) {
  setSetting('backupTime', time)
  setSetting('backupKeep', String(keep))
}


// ── 洞察条数（我的页可调） ──
export function getInsightCount(): number {
  const raw = Number(getSetting('insightCount') ?? '3')
  return Number.isFinite(raw) ? Math.min(10, Math.max(2, Math.round(raw))) : 3
}

export function setInsightCount(n: number) {
  setSetting('insightCount', String(n))
}
