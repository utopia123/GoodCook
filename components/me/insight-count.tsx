'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/components/i18n-provider'
import { saveInsightCount } from '@/lib/actions/prefs'
import { cn } from '@/lib/utils'

const OPTIONS = [3, 5, 8]

/** 洞察卡显示条数：3 / 5 / 8 */
export function InsightCountPicker({ value }: { value: number }) {
  const router = useRouter()
  const t = useT()
  const [current, setCurrent] = useState(value)
  const [, startTransition] = useTransition()

  const pick = (n: number) => {
    setCurrent(n)
    startTransition(async () => {
      await saveInsightCount(n)
      router.refresh()
    })
  }

  return (
    <div className="mf-inset flex items-center gap-0.5 rounded-full p-0.5">
      {OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => pick(n)}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs transition-colors',
            current === n
              ? 'bg-[var(--mf-surface)] font-semibold text-accent shadow-sm'
              : 'text-secondary hover:text-ink',
          )}
        >
          {t('insight.countUnit', { n })}
        </button>
      ))}
    </div>
  )
}
