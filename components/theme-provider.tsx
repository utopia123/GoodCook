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
      if ((localStorage.getItem(THEME_KEY) as Theme) === 'system') {
        applyTheme('system')
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
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
