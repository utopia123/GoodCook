import * as React from 'react'

/** 页面顶部标题栏：大标题 + 可选副标题 + 右侧操作 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="whitespace-nowrap tracking-title text-2xl font-bold text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-secondary">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end sm:pb-1">
          {action}
        </div>
      )}
    </header>
  )
}
