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
    // 小红书网页版搜索未登录会 404，改用 Bing 站内检索，稳定可达
    return `https://www.bing.com/search?q=${encodeURIComponent(`site:xiaohongshu.com ${q} 菜谱`)}`
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
    <div className="mb-5 rounded-2xl border border-[var(--mf-glass-border)] bg-[var(--mf-surface)] p-3 shadow-[0_8px_22px_rgb(var(--mf-shadow)/0.12)]">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-accent" />
          <Input
            className="h-12 pl-10 text-[15px] font-medium"
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
          className="mf-accent-fill h-12 shrink-0 rounded-xl px-5 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgb(var(--mf-shadow)/0.28)] transition-transform active:scale-[0.97] disabled:opacity-40"
        >
          {t('search.go')}
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
