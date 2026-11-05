'use client'

import { useT } from '@/components/i18n-provider'
import { useTheme } from '@/components/theme-provider'

/** Tab 栏透明度（60%–100%），实时生效 */
export function NavAlphaSlider() {
  const t = useT()
  const { navAlpha, setNavAlpha } = useTheme()
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={60}
        max={100}
        step={2}
        value={navAlpha}
        onChange={(e) => setNavAlpha(Number(e.target.value))}
        aria-label={t('nav.alpha')}
        className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-[rgb(var(--mf-shadow)/0.25)] accent-[var(--mf-accent)]"
      />
      <span className="w-9 text-right text-xs tabular-nums text-secondary">
        {navAlpha}%
      </span>
    </div>
  )
}
