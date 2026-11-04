'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, DatabaseBackup, HardDrive, Settings2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { List, Row } from '@/components/ui/list'
import { IconChip } from '@/components/ui/icon-chip'
import { useT } from '@/components/i18n-provider'
import { runBackupNow, saveBackupSettings } from '@/lib/actions/backup'
import type { BackupFile } from '@/lib/backup'

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fmtTime(ms: number) {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 「我的」页：数据备份设置（每天时间 / 保留份数）+ 立即备份 + 备份列表 */
export function BackupSettings({
  config,
  files,
}: {
  config: { time: string; keep: number }
  files: BackupFile[]
}) {
  const router = useRouter()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState(config.time)
  const [keep, setKeep] = useState(String(config.keep))
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      setMsg('')
      setErr('')
      const form = new FormData()
      form.set('time', time)
      form.set('keep', keep)
      const res = await saveBackupSettings(form)
      if (res.ok) {
        setMsg(t('backup.saved'))
        router.refresh()
      } else setErr(res.error)
    })

  const runNow = () =>
    startTransition(async () => {
      setMsg('')
      setErr('')
      const res = await runBackupNow()
      if (res.ok) {
        setMsg(t('backup.done', { name: res.name }))
        router.refresh()
      } else setErr(res.error)
    })

  return (
    <>
      <List className="mt-3">
        <Row
          leading={
            <IconChip>
              <DatabaseBackup />
            </IconChip>
          }
          title={t('backup.title')}
          subtitle={t('backup.summary', {
            time: config.time,
            n: config.keep,
          })}
          chevron={false}
          trailing={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="mf-inset flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {t('backup.settings')}
                </button>
              </DialogTrigger>
              <DialogContent title={t('backup.title')}>
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-secondary">
                    {t('backup.hint')}
                  </p>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="b-time">{t('backup.time')}</Label>
                      <Input
                        id="b-time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                    <div className="w-28">
                      <Label htmlFor="b-keep">{t('backup.keepCount')}</Label>
                      <Input
                        id="b-keep"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={30}
                        value={keep}
                        onChange={(e) => setKeep(e.target.value)}
                      />
                    </div>
                  </div>

                  {msg && <p className="text-sm text-accent">{msg}</p>}
                  {err && <p className="text-sm text-danger">{err}</p>}

                  <Button
                    className="w-full"
                    loading={pending}
                    onClick={save}
                  >
                    {t('common.save')}
                  </Button>

                  <div className="border-t border-[var(--mf-glass-border)] pt-3">
                    <Button
                      variant="trough"
                      className="w-full"
                      loading={pending}
                      onClick={runNow}
                    >
                      <Archive className="h-4 w-4" />
                      {t('backup.now')}
                    </Button>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium text-secondary">
                      {t('backup.listTitle')}
                    </p>
                    {files.length === 0 ? (
                      <p className="py-2 text-center text-sm text-secondary">
                        {t('backup.empty')}
                      </p>
                    ) : (
                      <ul className="max-h-[180px] space-y-1.5 overflow-y-auto">
                        {files.map((f) => (
                          <li
                            key={f.name}
                            className="flex items-center gap-2 text-xs text-secondary"
                          >
                            <HardDrive className="h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0 flex-1 truncate font-mono">
                              {f.name}
                            </span>
                            <span className="shrink-0">{fmtSize(f.size)}</span>
                            <span className="shrink-0 opacity-70">
                              {fmtTime(f.mtime)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <DialogClose className="sr-only">
                    {t('common.cancel')}
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
      </List>
    </>
  )
}
