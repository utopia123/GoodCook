import { requireUser } from '@/lib/auth/user'
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
        <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-28 pt-5 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-6xl lg:px-6 lg:pt-8 lg:pb-12">
          {children}
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
