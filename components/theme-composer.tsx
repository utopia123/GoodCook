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
import {
  useTheme,
  type Palette,
  type Skin,
} from '@/components/theme-provider'
import { cn } from '@/lib/utils'

const PALETTES: { id: Palette; dots: string[] }[] = [
  { id: 'green', dots: ['#4ea96b', '#e7f2ea', '#f2f5f1'] },
  { id: 'celadon', dots: ['#3f7f6f', '#e4efe9', '#edf2ef'] },
  { id: 'caramel', dots: ['#c8792f', '#f7ebdd', '#f8f3ec'] },
  { id: 'slate', dots: ['#5a6e80', '#e6edf2', '#f1f4f7'] },
  { id: 'wine', dots: ['#a3494a', '#f4e5e4', '#f7f1ee'] },
]

const SKINS: { id: Skin; dots: string[] }[] = [
  { id: 'classic', dots: ['#4ea96b', '#e7f2ea', '#f2f5f1'] },
  { id: 'glass', dots: ['#ffffff', '#7ac8a0', '#bfe0d2'] },
  { id: 'panda', dots: ['#14181a', '#6cbf8b', '#eef2f0'] },
  { id: 'pixel', dots: ['#8fd1f7', '#c1442e', '#f0b429'] },
  { id: 'paper', dots: ['#fbf7ee', '#a96f34', '#e3d7c1'] },
]

/** 主题面板：风格 + 配色合并在一个入口 */
export function ThemeComposer() {
  const t = useT()
  const { skin, setSkin, palette, setPalette } = useTheme()
  const [open, setOpen] = useState(false)
  const locked = skin !== 'classic'

  const currentLabel =
    skin === 'classic' ? t(`palette.${palette}`) : t(`skin.${skin}`)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mf-inset flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary"
        >
          <PaletteIcon className="h-3.5 w-3.5" />
          {currentLabel}
        </button>
      </DialogTrigger>
      <DialogContent title={t('theme.composer')}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-secondary">
              {t('skin.title')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SKINS.map((s) => {
                const active = skin === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSkin(s.id)}
                    className={cn(
                      'mf-inset flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors',
                      active && 'ring-1 ring-accent/50',
                    )}
                  >
                    <span className="flex shrink-0 -space-x-1.5">
                      {s.dots.map((c) => (
                        <span
                          key={c}
                          className="h-4 w-4 rounded-full border border-white/70 shadow-sm"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                      {t(`skin.${s.id}`)}
                    </span>
                    {active && (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 text-accent"
                        strokeWidth={2.8}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-secondary">
              {t('palette.title')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PALETTES.map((p) => {
                const active = palette === p.id && !locked
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={locked}
                    onClick={() => setPalette(p.id)}
                    className={cn(
                      'mf-inset flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors',
                      active && 'ring-1 ring-accent/50',
                      locked && 'opacity-45',
                    )}
                  >
                    <span className="flex shrink-0 -space-x-1.5">
                      {p.dots.map((c) => (
                        <span
                          key={c}
                          className="h-4 w-4 rounded-full border border-white/70 shadow-sm"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                      {t(`palette.${p.id}`)}
                    </span>
                    {active && (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 text-accent"
                        strokeWidth={2.8}
                      />
                    )}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-secondary">
              {locked ? t('palette.lockedBySkin') : t('palette.hint')}
            </p>
          </div>

          <DialogClose className="sr-only">{t('common.cancel')}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
