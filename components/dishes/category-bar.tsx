'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'
import { CategoryManager } from './category-manager'
import type { DishCategory } from '@/lib/db/schema'

export type CategoryWithCount = DishCategory & { count: number }

function tabClass(active: boolean) {
  return cn(
    'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition-colors sm:px-4 sm:py-2 sm:text-sm',
    active
      ? 'border-accent/40 bg-accent/15 font-semibold text-accent'
      : 'border-[var(--mf-glass-border)] bg-[var(--mf-surface)] text-secondary hover:text-ink',
  )
}

/**
 * 分类过滤栏：全部 / 各自定义分类 / 未分类。
 * 通过 URL searchParams(?cat=) 过滤，手机横向滑动、桌面自动换行。
 */
export function CategoryBar({
  categories,
  total,
  uncategorized,
}: {
  categories: CategoryWithCount[]
  total: number
  uncategorized: number
}) {
  const t = useT()
  const sp = useSearchParams()
  const current = sp.get('cat') ?? 'all'

  const tabs: { key: string; label: string; count: number }[] = [
    { key: 'all', label: t('dishes.all'), count: total },
    ...categories.map((c) => ({
      key: c.id,
      label: c.name,
      count: c.count,
    })),
    { key: 'none', label: t('dishes.uncategorized'), count: uncategorized },
  ]

  const href = (key: string) =>
    key === 'all' ? '/dishes' : `/dishes?cat=${encodeURIComponent(key)}`

  return (
    <div className="mb-5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium tracking-wide text-secondary">
          {t('picker.groupCategory')}
        </span>
        <CategoryManager categories={categories}>
          <button
            type="button"
            className="mf-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-secondary hover:text-ink"
            title={t('dishes.manage')}
            aria-label={t('dishes.manage')}
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </CategoryManager>
      </div>
      <nav aria-label={t('dishes.manage')} className="flex flex-wrap items-center gap-x-2.5 gap-y-3">
        {tabs.map((tab) => (
          <Link key={tab.key} href={href(tab.key)} className="shrink-0">
            <span className={tabClass(current === tab.key)}>
              {tab.label}
              <span className="ml-1.5 opacity-60">{tab.count}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
