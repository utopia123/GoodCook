'use client'

import { useState, useSyncExternalStore } from 'react'
import { SearchInput } from '@/components/ui/search-input'
import { useT } from '@/components/i18n-provider'
import { searchBili, searchBing, searchXhs } from '@/lib/link-out'
import { cn } from '@/lib/utils'

type Platform = 'bing' | 'bili' | 'xhs'

const PLATFORMS: { id: Platform; labelKey: string }[] = [
  { id: 'bing', labelKey: 'search.bing' },
  { id: 'bili', labelKey: 'search.bili' },
  { id: 'xhs', labelKey: 'search.xhs' },
]

const KEY = 'goodcook-search-platform'

function readPlatform(): Platform {
  const v = localStorage.getItem(KEY)
  return v === 'bili' || v === 'xhs' ? v : 'bing'
}

function subscribePlatform(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener('goodcook-platform', cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener('goodcook-platform', cb)
  }
}

/** 首页菜谱搜索：把关键词丢到所选平台搜索 */
export function RecipeSearch() {
  const t = useT()
  const [q, setQ] = useState('')
  // 平台偏好从 localStorage 读取；避免在 effect 中同步 setState
  const platform = useSyncExternalStore(
    subscribePlatform,
    readPlatform,
    () => 'bing' as Platform,
  )

  const setPlatform = (p: Platform) => {
    localStorage.setItem(KEY, p)
    window.dispatchEvent(new Event('goodcook-platform'))
  }

  const search = () => {
    const kw = q.trim()
    if (!kw) return
    const phrase = `${kw} 菜谱`
    if (platform === 'bili') {
      searchBili(phrase)
      return
    }
    if (platform === 'xhs') {
      searchXhs(phrase)
      return
    }
    searchBing(`${kw} 菜谱做法`)
  }

  return (
    <div className="mf-raised mb-5 p-3.5">
      <div className="flex items-center gap-2">
        <SearchInput
          className="flex-1"
          value={q}
          onChange={setQ}
          placeholder={t('search.placeholder')}
          inputClassName="h-12 text-[15px] font-medium"
          accent
          onKeyDown={(e) => {
            if (e.key === 'Enter') search()
          }}
        />
        <button
          type="button"
          onClick={search}
          disabled={!q.trim()}
          className="mf-accent-fill h-12 shrink-0 whitespace-nowrap rounded-xl px-3.5 text-[14px] font-semibold text-white shadow-[0_6px_16px_rgb(var(--mf-shadow)/0.28)] transition-transform active:scale-[0.97] disabled:opacity-40"
        >
          {platform === 'xhs'
            ? t('search.goXhs')
            : platform === 'bili'
              ? t('search.goBili')
              : t('search.go')}
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            className={cn(
              'h-10 rounded-xl border text-[13px] transition-colors',
              platform === p.id
                ? 'border-accent bg-accent font-semibold text-white shadow-[0_4px_12px_rgb(var(--mf-shadow)/0.2)]'
                : 'border-[var(--mf-glass-border)] text-secondary hover:text-ink',
            )}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>
    </div>
  )
}
