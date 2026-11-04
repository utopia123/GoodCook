import { Coffee, Moon, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Moon,
} as const

/** 餐次图标：与导航统一的线性图标风格 */
export function MealTypeIcon({
  type,
  className,
}: {
  type: string
  className?: string
}) {
  const Icon = ICONS[type as keyof typeof ICONS] ?? Utensils
  return <Icon className={cn('h-5 w-5', className)} strokeWidth={1.8} />
}
