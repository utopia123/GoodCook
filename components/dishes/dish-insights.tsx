import { Flame, Clock3, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'

export type InsightItem = { name: string; meta?: string }

export type InsightCard = {
  kind: 'hot' | 'stale' | 'never'
  label: string
  items: InsightItem[]
}

const ICONS = {
  hot: Flame,
  stale: Clock3,
  never: Snowflake,
} as const

const TONES = {
  hot: 'text-danger',
  stale: 'text-warn',
  never: 'text-secondary',
} as const

/** 菜品热度洞察：最常点 / 好久没吃 / 从没点过 */
export function DishInsights({ cards }: { cards: InsightCard[] }) {
  if (cards.length === 0) return null
  return (
    <div className="mb-4 grid gap-2.5 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = ICONS[card.kind]
        return (
          <div key={card.kind} className="mf-raised mf-solid p-3.5">
            <p
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold',
                TONES[card.kind],
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {card.label}
            </p>
            <ul className="mt-2 space-y-1">
              {card.items.map((item, i) => (
                <li
                  key={`${item.name}-${i}`}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="truncate text-ink">{item.name}</span>
                  {item.meta && (
                    <span className="shrink-0 text-xs text-secondary">
                      {item.meta}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
