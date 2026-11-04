'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'
import { NAV_TABS } from '@/components/bottom-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Github } from 'lucide-react'

/** 桌面端左侧导航栏（lg 及以上显示）：固定整高磨砂玻璃栏 */
export function DesktopSidebar() {
  const pathname = usePathname()
  const t = useT()
  return (
    <aside className="mf-sidebar fixed inset-y-0 left-0 z-40 hidden w-60 flex-col px-4 py-6 xl:w-64 lg:flex">
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
                  : 'text-secondary hover:bg-black/5 hover:text-ink dark:hover:bg-white/5',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              {t(tab.key)}
            </Link>
          )
        })}
      </nav>

      {/* 底部：外观切换 */}
      <div className="flex-1" />
      <div className="border-t border-[var(--mf-glass-border)] pt-3">
        <ThemeToggle className="w-full" />
        <a
          href="https://github.com/utopia123/GoodCook"
          target="_blank"
          rel="noreferrer"
          className="mt-1 flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm text-secondary transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/5"
        >
          <Github className="h-4 w-4" />
          <span className="truncate">utopia123/GoodCook</span>
        </a>
      </div>
    </aside>
  )
}
