'use client'

import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { useT } from '@/components/i18n-provider'
import { useTheme, type Skin } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

const SKINS: { id: Skin; dots: string[] }[] = [
  { id: 'classic', dots: ['#4ea96b', '#e7f2ea', '#f2f5f1'] },
  { id: 'glass', dots: ['#ffffff', '#7ac8a0', '#bfe0d2'] },
  { id: 'panda', dots: ['#14181a', '#6cbf8b', '#eef2f0'] },
  { id: 'pixel', dots: ['#8fd1f7', '#c1442e', '#f0b429'] },
  { id: 'paper', dots: ['#fbf7ee', '#a96f34', '#e3d7c1'] },
]

/** 风格（材质/主题感）选择器：选择后配色由风格接管 */
export function SkinPicker() {
  const t = useT()
  const { skin, setSkin } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mf-inset flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-secondary"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t(`skin.${skin}`)}
        </button>
      </DialogTrigger>
      <DialogContent title={t('skin.title')}>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          {SKINS.map((s) => {
            const active = skin === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSkin(s.id)
                  setOpen(false)
                }}
                className={cn(
                  'mf-inset flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                  active && 'ring-1 ring-accent/50',
                )}
              >
                <span className="flex shrink-0 -space-x-1.5">
                  {s.dots.map((c) => (
                    <span
                      key={c}
                      className="h-5 w-5 rounded-full border border-white/70 shadow-sm"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] text-ink">
                  {t(`skin.${s.id}`)}
                </span>
                {active && (
                  <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.6} />
                )}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-secondary">
          {t('skin.hint')}
        </p>
        <DialogClose className="sr-only">{t('common.cancel')}</DialogClose>
      </DialogContent>
    </Dialog>
  )
}
