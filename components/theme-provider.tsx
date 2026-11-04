'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type Palette = 'green' | 'celadon' | 'caramel' | 'slate' | 'wine'
export type UiScale = 'sm' | 'md' | 'lg'

const THEME_KEY = 'goodcook-theme'
const PALETTE_KEY = 'goodcook-palette'
const SCALE_KEY = 'goodcook-scale'
const SCALE_VALUE: Record<UiScale, string> = { sm: '0.92', md: '', lg: '1.08' }

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  // 让原生控件、滚动条、输入框跟随明暗
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

/** 当前存的是「跟随系统」吗（直接读存储，避免闭包里的旧值） */
function isSystemMode() {
  return ((localStorage.getItem('goodcook-theme') as Theme) || 'system') === 'system'
}

function applyPalette(palette: Palette) {
  document.documentElement.dataset.theme = palette
}

function applyScale(scale: UiScale) {
  // 整页缩放：文字与间距等比变化，手机与电脑表现一致
  document.documentElement.style.zoom = SCALE_VALUE[scale]
}

const ThemeCtx = createContext<{
  theme: Theme
  palette: Palette
  scale: UiScale
  setTheme: (t: Theme) => void
  setPalette: (p: Palette) => void
  setScale: (s: UiScale) => void
}>({
  theme: 'system',
  palette: 'green',
  scale: 'md',
  setTheme: () => {},
  setPalette: () => {},
  setScale: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [palette, setPaletteState] = useState<Palette>('green')
  const [scale, setScaleState] = useState<UiScale>('md')

  useEffect(() => {
    const savedTheme = (localStorage.getItem(THEME_KEY) as Theme) || 'system'
    // 从 localStorage 同步持久化状态：外部存储初始化，非级联渲染
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(savedTheme)
    applyTheme(savedTheme)

    const savedPalette =
      (localStorage.getItem(PALETTE_KEY) as Palette) || 'green'
    setPaletteState(savedPalette)
    applyPalette(savedPalette)

    const savedScale = (localStorage.getItem(SCALE_KEY) as UiScale) || 'md'
    setScaleState(savedScale)
    applyScale(savedScale)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (isSystemMode()) applyTheme('system')
    }
    // 旧版 iOS Safari 只有 addListener
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange)
    } else {
      mq.addListener(onChange)
    }

    // 手机切深色时页面常处于后台，change 事件可能不触发：回到前台再判定一次
    const recheck = () => {
      if (document.visibilityState === 'visible' && isSystemMode()) {
        applyTheme('system')
      }
    }
    document.addEventListener('visibilitychange', recheck)
    window.addEventListener('focus', recheck)
    window.addEventListener('pageshow', recheck)

    return () => {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', onChange)
      } else {
        mq.removeListener(onChange)
      }
      document.removeEventListener('visibilitychange', recheck)
      window.removeEventListener('focus', recheck)
      window.removeEventListener('pageshow', recheck)
    }
  }, [])

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(THEME_KEY, t)
    setThemeState(t)
    applyTheme(t)
  }, [])

  const setPalette = useCallback((p: Palette) => {
    localStorage.setItem(PALETTE_KEY, p)
    setPaletteState(p)
    applyPalette(p)
  }, [])

  const setScale = useCallback((sc: UiScale) => {
    localStorage.setItem(SCALE_KEY, sc)
    setScaleState(sc)
    applyScale(sc)
  }, [])

  return (
    <ThemeCtx.Provider
      value={{ theme, palette, scale, setTheme, setPalette, setScale }}
    >
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
