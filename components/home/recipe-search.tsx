'use client'

import { useState, useSyncExternalStore } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useT } from '@/components/i18n-provider'
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

function urlFor(platform: Platform, q: string) {
  if (platform === 'bili') {
    return `https://search.bilibili.com/all?keyword=${encodeURIComponent(`${q} 菜谱`)}`
  }
  if (platform === 'xhs') {
    return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(`${q} 菜谱`)}`
  }
  return `https://www.bing.com/search?q=${encodeURIComponent(`${q} 菜谱做法`)}`
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
    window.open(urlFor(platform, kw), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') search()
            }}
            placeholder={t('search.placeholder')}
            enterKeyHint="search"
          />
        </div>
        <button
          type="button"
          onClick={search}
          disabled={!q.trim()}
          className="mf-accent-fill h-11 shrink-0 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {t('search.go')}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] font-medium text-secondary">
          {t('search.platform')}
        </span>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
              platform === p.id
                ? 'border-accent/40 bg-accent/15 font-semibold text-accent'
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
