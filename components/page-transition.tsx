'use client'

import { usePathname } from 'next/navigation'

/** 页面切换时的轻微上浮淡入（CSS 动画，切页自动重放） */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="mf-page-anim">
      {children}
    </div>
  )
}
