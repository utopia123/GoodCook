import { requireUser } from '@/lib/auth/user'
import { Github } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { DesktopSidebar } from '@/components/desktop-sidebar'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireUser()
  return (
    <div className="min-h-dvh">
      <DesktopSidebar />
      {/* 桌面端为固定侧边栏让出宽度，内容在剩余空间居中 */}
      <div className="lg:pl-60 xl:pl-64">
        <div className="mx-auto w-full max-w-md px-4 pb-28 pt-5 sm:max-w-2xl md:max-w-3xl lg:max-w-none lg:px-8 lg:pb-10 lg:pt-7 2xl:max-w-[1500px]">
          {children}
          {/* 页脚：源码仓库入口 */}
          <footer className="mt-10 text-center">
            <a
              href="https://github.com/utopia123/GoodCook"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-secondary/70 transition-colors hover:text-accent"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub · utopia123/GoodCook
            </a>
          </footer>
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
