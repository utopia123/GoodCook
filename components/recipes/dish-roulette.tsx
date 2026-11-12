'use client'

import { useState } from 'react'
import { BookHeart, Minus, Plus, RotateCw, Shuffle, Tv } from 'lucide-react'
import { useT } from '@/components/i18n-provider'
import { searchBili, searchXhs } from '@/lib/link-out'
import { cn } from '@/lib/utils'

export type RouletteDish = { id: string; name: string; soup: boolean }

/** 从池子里随机取 n 个，不重复 */
function sample<T>(pool: T[], n: number): T[] {
  const copy = [...pool]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.max(0, n))
}

/**
 * 配菜转盘：按人数（几人几菜）+ 是否带汤，随机凑一桌。
 * 结果只列菜名，右侧给小红书 / B站 搜做法的直达入口。
 */
export function DishRoulette({ dishes }: { dishes: RouletteDish[] }) {
  const t = useT()
  const [diners, setDiners] = useState(4)
  const [withSoup, setWithSoup] = useState(true)
  const [picked, setPicked] = useState<RouletteDish[]>([])
  const [spinning, setSpinning] = useState(false)
  const [short, setShort] = useState(false)
  const [missSoup, setMissSoup] = useState(false)

  const mains = dishes.filter((d) => !d.soup)
  const soups = dishes.filter((d) => d.soup)
  const empty = dishes.length === 0

  const spin = () => {
    if (empty) return
    setSpinning(true)
    // 短暂转一下再出结果，给「摇」一个反馈（系统减少动效时也只是不转圈）
    window.setTimeout(() => {
      const wanted = Math.min(diners, mains.length)
      const mainPicked = sample(mains, wanted)
      const soupPicked = withSoup ? sample(soups, 1) : []
      setPicked([...mainPicked, ...soupPicked])
      setShort(wanted < diners)
      setMissSoup(withSoup && soups.length === 0)
      setSpinning(false)
    }, 480)
  }

  const mainCount = picked.filter((d) => !d.soup).length

  return (
    <section className="mf-raised mb-4 p-3.5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <Shuffle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {t('roulette.title')}
          </p>
          <p className="truncate text-[11px] text-secondary">
            {t('roulette.hint')}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="mf-inset flex items-center gap-1 rounded-full p-0.5">
          <button
            type="button"
            onClick={() => setDiners((n) => Math.max(1, n - 1))}
            aria-label={t('roulette.less')}
            className="flex h-7 w-7 items-center justify-center rounded-full text-secondary transition-colors hover:text-ink disabled:opacity-40"
            disabled={diners <= 1}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[3.2em] text-center text-[13px] font-medium tabular-nums text-ink">
            {t('roulette.people', { n: diners })}
          </span>
          <button
            type="button"
            onClick={() => setDiners((n) => Math.min(8, n + 1))}
            aria-label={t('roulette.more')}
            className="flex h-7 w-7 items-center justify-center rounded-full text-secondary transition-colors hover:text-ink disabled:opacity-40"
            disabled={diners >= 8}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setWithSoup((v) => !v)}
          aria-pressed={withSoup}
          className={cn(
            'h-8 rounded-full border px-3 text-[13px] transition-colors',
            withSoup
              ? 'border-accent/40 bg-accent/15 font-semibold text-accent'
              : 'border-[var(--mf-glass-border)] text-secondary hover:text-ink',
          )}
        >
          {t('roulette.soup')}
        </button>

        <button
          type="button"
          onClick={spin}
          disabled={empty || spinning}
          className="mf-accent-fill ml-auto flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-40"
        >
          <RotateCw className={cn('h-4 w-4', spinning && 'animate-spin')} />
          {picked.length === 0 ? t('roulette.spin') : t('roulette.again')}
        </button>
      </div>

      {empty && (
        <p className="mt-3 text-[13px] text-secondary">{t('roulette.empty')}</p>
      )}

      {picked.length > 0 && (
        <>
          <p className="mt-3 text-[11px] text-secondary">
            {t('roulette.summary', { n: mainCount })}
            {picked.length > mainCount && ` · ${t('roulette.oneSoup')}`}
            {short && ` · ${t('roulette.short')}`}
            {missSoup && ` · ${t('roulette.noSoupDish')}`}
          </p>
          <ol className="mf-stagger mt-2 space-y-1.5">
            {picked.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-2 rounded-xl bg-[var(--mf-trough)] px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-[15px] text-ink">
                  {d.name}
                </span>
                <button
                  type="button"
                  onClick={() => searchXhs(`${d.name} 做法`)}
                  aria-label={t('roulette.searchXhs')}
                  title={t('roulette.searchXhs')}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#e8455f] transition-colors hover:bg-[var(--mf-surface)]"
                >
                  <BookHeart className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => searchBili(`${d.name} 做法`)}
                  aria-label={t('roulette.searchBili')}
                  title={t('roulette.searchBili')}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#3fa9d9] transition-colors hover:bg-[var(--mf-surface)]"
                >
                  <Tv className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
