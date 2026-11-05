'use client'

import { useState, useSyncExternalStore } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { useT } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'

const KEY = 'goodcook-bili-region'
type Region = '' | 'cn' | 'global'

function read(): Region {
  const v = localStorage.getItem(KEY)
  return v === 'cn' || v === 'global' ? v : ''
}

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener('goodcook-bili', cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener('goodcook-bili', cb)
  }
}

/** B 站跳转版本：展示当前值，点开选择 */
export function BiliRegionPicker() {
  const t = useT()
  const region = useSyncExternalStore(subscribe, read, () => '' as Region)
  const [open, setOpen] = useState(false)

  const set = (v: Region) => {
    if (v) localStorage.setItem(KEY, v)
    else localStorage.removeItem(KEY)
    window.dispatchEvent(new Event('goodcook-bili'))
    setOpen(false)
  }

  const options: { id: Region; label: string; desc: string }[] = [
    { id: '', label: t('bili.auto'), desc: t('bili.autoDesc') },
    { id: 'cn', label: t('bili.cn'), desc: t('bili.cnDesc') },
    { id: 'global', label: t('bili.global'), desc: t('bili.globalDesc') },
  ]

  const current = options.find((o) => o.id === region) ?? options[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mf-inset flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary"
        >
          {current.label}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent title={t('bili.title')}>
        <div className="space-y-2">
          {options.map((o) => {
            const active = region === o.id
            return (
              <button
                key={o.id || 'auto'}
                type="button"
                onClick={() => set(o.id)}
                className={cn(
                  'mf-inset flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
                  active && 'ring-1 ring-accent/50',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-ink">{o.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-secondary">
                    {o.desc}
                  </span>
                </span>
                {active && (
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    strokeWidth={2.6}
                  />
                )}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-secondary">
          {t('bili.hint')}
        </p>
        <DialogClose className="sr-only">{t('common.cancel')}</DialogClose>
      </DialogContent>
    </Dialog>
  )
}
