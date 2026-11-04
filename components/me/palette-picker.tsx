'use client'

import { useState } from 'react'
import { Check, Palette as PaletteIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { useT } from '@/components/i18n-provider'
import { useTheme, type Palette } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

const PALETTES: { id: Palette; dots: string[] }[] = [
  { id: 'green', dots: ['#4ea96b', '#e7f2ea', '#f2f5f1'] },
  { id: 'celadon', dots: ['#3f7f6f', '#e4efe9', '#edf2ef'] },
  { id: 'caramel', dots: ['#c8792f', '#f7ebdd', '#f8f3ec'] },
  { id: 'slate', dots: ['#5a6e80', '#e6edf2', '#f1f4f7'] },
  { id: 'wine', dots: ['#a3494a', '#f4e5e4', '#f7f1ee'] },
]

/** 配色方案选择器（我的页设置项） */
export function PalettePicker() {
  const t = useT()
  const { palette, setPalette } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mf-inset flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary"
        >
          <PaletteIcon className="h-3.5 w-3.5" />
          {t(`palette.${palette}`)}
        </button>
      </DialogTrigger>
      <DialogContent title={t('palette.title')}>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          {PALETTES.map((p) => {
            const active = palette === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPalette(p.id)}
                className={cn(
                  'mf-inset flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                  active && 'ring-1 ring-accent/50',
                )}
              >
                <span className="flex shrink-0 -space-x-1.5">
                  {p.dots.map((c) => (
                    <span
                      key={c}
                      className="h-5 w-5 rounded-full border border-white/70 shadow-sm"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] text-ink">
                  {t(`palette.${p.id}`)}
                </span>
                {active && (
                  <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.6} />
                )}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-secondary">
          {t('palette.hint')}
        </p>
        <DialogClose className="sr-only">{t('common.cancel')}</DialogClose>
      </DialogContent>
    </Dialog>
  )
}
