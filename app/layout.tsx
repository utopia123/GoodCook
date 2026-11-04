import type { Metadata, Viewport } from 'next'
import './globals.css'
import { I18nProvider } from '@/components/i18n-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { getLocale, getMessages } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'GoodCook',
  description: '可自部署到 NAS 的家庭点菜系统 · 让每一顿饭都充满期待',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.webp', type: 'image/webp' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f5f1' },
    { media: '(prefers-color-scheme: dark)', color: '#121518' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

/** 首帧前同步应用主题，避免暗色用户看到白色闪烁 */
const themeInitScript = `(function(){try{var t=localStorage.getItem('goodcook-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  const messages = getMessages(locale)
  return (
    <html lang={locale === 'zh' ? 'zh-CN' : 'en'} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={locale} messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
