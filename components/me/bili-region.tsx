'use client'

import { useSyncExternalStore } from 'react'
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

/** B 站跳转版本：每次询问 / 国内版 / 国际版 */
export function BiliRegionPicker() {
  const t = useT()
  const region = useSyncExternalStore(subscribe, read, () => '' as Region)

  const set = (v: Region) => {
    if (v) localStorage.setItem(KEY, v)
    else localStorage.removeItem(KEY)
    window.dispatchEvent(new Event('goodcook-bili'))
  }

  const options: { id: Region; label: string }[] = [
    { id: '', label: t('bili.auto') },
    { id: 'cn', label: t('bili.cn') },
    { id: 'global', label: t('bili.global') },
  ]

  return (
    <div className="mf-inset flex items-center gap-0.5 rounded-full p-0.5">
      {options.map((o) => (
        <button
          key={o.id || 'auto'}
          type="button"
          onClick={() => set(o.id)}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs transition-colors',
            region === o.id
              ? 'bg-[var(--mf-surface)] font-semibold text-accent shadow-sm'
              : 'text-secondary hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
