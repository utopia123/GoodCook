'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SelectOption = { value: string; label: string }

/**
 * 主题化下拉选择：原生 select 的选项面板由浏览器绘制，深色模式下会是白底黑字，
 * 因此改用受控弹层，颜色跟随主题令牌。
 */
export function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = options.find((o) => o.value === value)

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="mf-inset flex h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-[15px] text-ink outline-none focus:ring-2 focus:ring-accent/50"
      >
        <span className={cn('truncate', !current && 'text-secondary')}>
          {current?.label ?? placeholder ?? ''}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-secondary transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-60 overflow-y-auto rounded-xl border border-[var(--mf-glass-border)] bg-[var(--mf-surface)] p-1 shadow-[0_18px_44px_rgb(var(--mf-shadow)/0.22)]"
        >
          {options.map((o) => {
            const active = o.value === value
            return (
              <button
                key={o.value || '__none'}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                  active
                    ? 'bg-[rgb(var(--mf-accent-soft)/0.16)] font-medium text-accent'
                    : 'text-ink hover:bg-[rgb(var(--mf-accent-soft)/0.08)]',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {active && <Check className="h-4 w-4 shrink-0" strokeWidth={2.6} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
