import 'server-only'
import {
  mkdir,
  readdir,
  readFile,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import JSZip from 'jszip'
import { DATA_DIR, DB_PATH, UPLOAD_DIR } from '@/lib/env'
import { APP_VERSION_DISPLAY } from '@/lib/version'
import { getBackupConfig } from '@/lib/settings'

/**
 * 数据备份：data/backups/ 下每天一份 zip（数据库 + 全部图片 + 密钥），
 * 滚动保留最近 5 份。还原方式：停容器 → 解压覆盖 data 目录 → 启动。
 */
export const BACKUP_DIR = join(DATA_DIR, 'backups')
const NAME_RE = /^goodcook-backup-.*\.zip$/

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function stamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}

async function addDir(zip: JSZip, dir: string, prefix: string) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await addDir(zip, p, `${prefix}/${e.name}`)
    else if (e.isFile()) zip.file(`${prefix}/${e.name}`, await readFile(p))
  }
}

export type BackupFile = { name: string; size: number; mtime: number }

export async function listBackups(): Promise<BackupFile[]> {
  try {
    const files = await readdir(BACKUP_DIR)
    const out: BackupFile[] = []
    for (const f of files) {
      if (!NAME_RE.test(f)) continue
      const st = await stat(join(BACKUP_DIR, f))
      out.push({ name: f, size: st.size, mtime: st.mtimeMs })
    }
    return out.sort((a, b) => b.mtime - a.mtime)
  } catch {
    return []
  }
}

async function prune() {
  const list = await listBackups()
  const { keep } = getBackupConfig()
  for (const f of list.slice(keep)) {
    try {
      await unlink(join(BACKUP_DIR, f.name))
    } catch {
      // 忽略
    }
  }
}

/** 立即生成一份完整备份（一致性快照，运行中也可安全执行） */
export async function createBackup(): Promise<BackupFile> {
  await mkdir(BACKUP_DIR, { recursive: true })
  const tmp = join(BACKUP_DIR, `.snapshot-${Date.now()}.db`)

  // better-sqlite3 backup API：WAL 模式下也能拿到一致快照
  const conn = new Database(DB_PATH)
  try {
    await conn.backup(tmp)
  } finally {
    conn.close()
  }

  try {
    const zip = new JSZip()
    zip.file('app.db', await readFile(tmp))
    await addDir(zip, UPLOAD_DIR, 'uploads')
    for (const secret of ['auth.secret', 'cron.secret']) {
      try {
        zip.file(secret, await readFile(join(DATA_DIR, secret)))
      } catch {
        // 首次启动可能还没有密钥文件
      }
    }
    zip.file(
      'backup-info.json',
      JSON.stringify(
        {
          app: 'goodcook',
          version: APP_VERSION_DISPLAY,
          createdAt: new Date().toISOString(),
          contents: ['app.db', 'uploads/', 'auth.secret', 'cron.secret'],
        },
        null,
        2,
      ),
    )

    const name = `goodcook-backup-${stamp()}.zip`
    const out = join(BACKUP_DIR, name)
    const buf = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    await writeFile(out, buf)
    const st = await stat(out)
    await prune()
    return { name, size: st.size, mtime: st.mtimeMs }
  } finally {
    await unlink(tmp).catch(() => {})
  }
}

let running = false

/** 每天最多备份一次（幂等：当天已有备份则跳过） */
export async function maybeRunDailyBackup(): Promise<boolean> {
  if (running) return false
  running = true
  try {
    const list = await listBackups()
    const d = new Date()
    const tag = `goodcook-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    if (list.some((f) => f.name.startsWith(tag))) return false
    // 未到设定的备份时间则跳过（调度器每 5 分钟检查一次）
    const { time } = getBackupConfig()
    const [hh, mm] = time.split(':').map(Number)
    if (d.getHours() * 60 + d.getMinutes() < hh * 60 + mm) return false
    await createBackup()
    console.log('[backup] 已生成每日备份')
    return true
  } catch (e) {
    console.error('[backup] 备份失败', e)
    return false
  } finally {
    running = false
  }
}
