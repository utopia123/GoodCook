'use client'

import { useT } from '@/components/i18n-provider'
import { useTheme, type UiScale } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

const OPTIONS: UiScale[] = ['sm', 'md', 'lg']

/** 字号三档：整页等比缩放，手机与电脑一致 */
export function UiScalePicker() {
  const t = useT()
  const { scale, setScale } = useTheme()

  return (
    <div className="mf-inset flex items-center gap-0.5 rounded-full p-0.5">
      {OPTIONS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setScale(s)}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs transition-colors',
            scale === s
              ? 'bg-[var(--mf-surface)] font-semibold text-accent shadow-sm'
              : 'text-secondary hover:text-ink',
          )}
        >
          {t(`scale.${s}`)}
        </button>
      ))}
    </div>
  )
}
