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
const BILI_KEY = 'goodcook-bili-region'

type BiliRegion = '' | 'cn' | 'global'

function readBiliRegion(): BiliRegion {
  const v = localStorage.getItem(BILI_KEY)
  return v === 'cn' || v === 'global' ? v : ''
}

function subscribeBili(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener('goodcook-bili', cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener('goodcook-bili', cb)
  }
}

/**
 * 先尝试唤起 App，2 秒内未离开当前页则回退到网页。
 * 回退用同页跳转（window.open 在定时器里会被浏览器拦截）。
 */
function openAppWithFallback(scheme: string, webUrl: string) {
  const ua = navigator.userAgent.toLowerCase()
  const mobile = /iphone|ipad|ipod|android/.test(ua)
  if (!mobile) {
    window.open(webUrl, '_blank', 'noopener,noreferrer')
    return
  }

  let left = false
  const markLeft = () => {
    left = true
  }
  document.addEventListener('visibilitychange', markLeft)
  window.addEventListener('blur', markLeft)
  window.addEventListener('pagehide', markLeft)

  window.location.href = scheme

  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', markLeft)
    window.removeEventListener('blur', markLeft)
    window.removeEventListener('pagehide', markLeft)
    const stillHere =
      !left && document.visibilityState === 'visible' && document.hasFocus()
    if (stillHere) window.location.href = webUrl
  }, 2000)
}

function biliAppScheme(region: Exclude<BiliRegion, ''>, q: string) {
  const kw = encodeURIComponent(`${q} 菜谱`)
  // 国内版 B 站 App 的搜索深链；国际版 App（com.bstar.intl）用 bstar 前缀
  return region === 'global'
    ? `bstar://search?keyword=${kw}`
    : `bilibili://search?keyword=${kw}`
}

function biliUrl(region: Exclude<BiliRegion, ''>, q: string) {
  const kw = encodeURIComponent(`${q} 菜谱`)
  return region === 'global'
    ? `https://www.bilibili.tv/en/search-result?q=${kw}`
    : `https://search.bilibili.com/all?keyword=${kw}`
}

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

function urlFor(platform: Platform, q: string, bili: BiliRegion = 'cn') {
  if (platform === 'bili') {
    return biliUrl(bili === 'global' ? 'global' : 'cn', q)
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
  const [biliAsk, setBiliAsk] = useState(false)
  const [pendingKw, setPendingKw] = useState('')
  const biliRegion = useSyncExternalStore(
    subscribeBili,
    readBiliRegion,
    () => '' as BiliRegion,
  )
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
    if (platform === 'bili') {
      if (!biliRegion) {
        setPendingKw(kw)
        setBiliAsk(true)
        return
      }
      openAppWithFallback(biliAppScheme(biliRegion, kw), biliUrl(biliRegion, kw))
      return
    }

    if (platform === 'xhs') {
      openAppWithFallback(
        `xhsdiscover://search/result?keyword=${encodeURIComponent(`${kw} 菜谱`)}`,
        urlFor('xhs', kw),
      )
      return
    }

    window.open(urlFor(platform, kw, biliRegion), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mf-raised mb-5 p-3.5">
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

      {biliAsk && platform === 'bili' && pendingKw && (
        <div className="mt-2.5 rounded-xl border border-[var(--mf-glass-border)] p-2.5">
          <p className="mb-2 text-[11px] text-secondary">
            {t('search.biliAsk')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['cn', 'global'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  localStorage.setItem(BILI_KEY, r)
                  window.dispatchEvent(new Event('goodcook-bili'))
                  setBiliAsk(false)
                  openAppWithFallback(biliAppScheme(r, pendingKw), biliUrl(r, pendingKw))
                }}
                className="h-9 rounded-lg border border-[var(--mf-glass-border)] text-[13px] text-ink"
              >
                {t(r === 'cn' ? 'search.biliCn' : 'search.biliGlobal')}
              </button>
            ))}
          </div>
        </div>
      )}

      {platform === 'xhs' && (
        <p className="mt-2 text-[11px] leading-relaxed text-secondary">
          {t('search.xhsHint')}
        </p>
      )}
    </div>
  )
}
