'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type Theme } from '@/components/theme-provider'
import { useT } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'

const ORDER: Theme[] = ['light', 'dark', 'system']

/** 显示当前外观状态；点一下循环切换 浅色 → 深色 → 跟随系统 */
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
  // 显示「当前」状态，而不是下一档（避免深色模式下却显示“跟随系统”的误导）
  const label = t(`theme.${theme}`)
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

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
      title={t('theme.switchTo', { name: t(`theme.${next}`) })}
      className={cn(
        'flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[15px] font-medium text-secondary transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/5',
        className,
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  )
}
