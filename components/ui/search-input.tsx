'use client'

import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useT } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'

/**
 * 搜索输入框：左侧放大镜，有内容时右侧出现清空按钮。
 * 全站搜索统一用它，避免有的地方能清、有的地方不能。
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  accent = false,
  onKeyDown,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  /** 放大镜用主色（首页搜索卡用），默认次要色 */
  accent?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  const t = useT()
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('relative', className)}>
      <Search
        className={cn(
          'pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2',
          accent ? 'text-accent' : 'text-secondary',
        )}
      />
      <Input
        ref={ref}
        className={cn('pl-10 pr-10', inputClassName)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        enterKeyHint="search"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            ref.current?.focus()
          }}
          aria-label={t('search.clear')}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:bg-[var(--mf-trough)] hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
