'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type Theme } from '@/components/theme-provider'
import { useT } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'

const ORDER: Theme[] = ['light', 'dark', 'system']

/** 循环切换 浅色 → 深色 → 跟随系统 */
export function ThemeToggle({
  variant = 'chip',
  className,
}: {
  variant?: 'chip' | 'row'
  className?: string
}) {
  const { theme, setTheme } = useTheme()
  const t = useT()
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
  const label = t(`theme.${next}`)
  const Icon = next === 'light' ? Sun : next === 'dark' ? Moon : Monitor

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        className={cn('flex w-full items-center gap-3 text-left', className)}
      >
        <Icon className="h-[18px] w-[18px]" />
        <span className="flex-1">{t('theme.title')}</span>
        <span className="text-sm text-secondary">{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={label}
      className={cn(
        'flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[15px] font-medium text-secondary transition-colors hover:bg-black/5 hover:text-ink',
        className,
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  )
}
