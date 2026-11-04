'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'
import { NAV_TABS } from '@/components/bottom-nav'

/** 桌面端左侧导航栏（lg 及以上显示，手机端由 BottomNav 接管） */
export function DesktopSidebar() {
  const pathname = usePathname()
  const t = useT()
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col px-4 py-6 xl:w-60 lg:flex">
      {/* 品牌 */}
      <Link href="/home" className="mb-8 flex items-center gap-2.5 px-2">
        <Image
          src="/logo.webp"
          alt={t('app.name')}
          width={36}
          height={36}
          className="rounded-xl"
        />
        <span className="text-lg font-bold tracking-title text-ink">
          {t('app.name')}
        </span>
      </Link>

      {/* 导航 */}
      <nav className="flex flex-col gap-1.5">
        {NAV_TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + '/')
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[15px] font-medium transition-colors',
                active
                  ? 'bg-accent/12 font-semibold text-accent'
                  : 'text-secondary hover:bg-black/5 hover:text-ink',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              {t(tab.key)}
            </Link>
          )
        })}
      </nav>

      {/* 底部留白：整栏高度撑满，导航靠上 */}
      <div className="flex-1" />
    </aside>
  )
}
