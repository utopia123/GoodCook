import Link from 'next/link'
import { cn } from '@/lib/utils'

export type HeatRow = {
  name: string
  meta: string
  /** hot = 常点；stale = 久未吃（决定左侧小圆点颜色） */
  kind: 'hot' | 'stale'
}

/**
 * 菜品热度：一行一道菜。
 * 相比三张并排的卡，行式更省纵向空间，也能带一句「为什么推荐」。
 */
export function DishInsights({
  rows,
  footer,
}: {
  rows: HeatRow[]
  footer?: { text: string; href: string; label: string }
}) {
  if (rows.length === 0) return null

  return (
    <div className="mf-raised overflow-hidden">
      <ul>
        {rows.map((row, i) => (
          <li
            key={`${row.kind}-${row.name}-${i}`}
            className="flex items-center gap-3 border-b border-[var(--mf-glass-border)] px-4 py-2.5 last:border-b-0"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                row.kind === 'hot' ? 'bg-danger' : 'bg-warn',
              )}
            />
            <span className="min-w-0 flex-1 truncate text-[15px] text-ink">
              {row.name}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-secondary">
              {row.meta}
            </span>
          </li>
        ))}
      </ul>

      {footer && (
        <div className="flex items-center justify-between gap-2 border-t border-[var(--mf-glass-border)] px-4 py-2.5">
          <span className="truncate text-xs text-secondary">{footer.text}</span>
          <Link
            href={footer.href}
            className="shrink-0 text-xs font-medium text-accent"
          >
            {footer.label}
          </Link>
        </div>
      )}
    </div>
  )
}
