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

const THEME_KEY = 'goodcook-theme'
const PALETTE_KEY = 'goodcook-palette'

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

const ThemeCtx = createContext<{
  theme: Theme
  palette: Palette
  setTheme: (t: Theme) => void
  setPalette: (p: Palette) => void
}>({
  theme: 'system',
  palette: 'green',
  setTheme: () => {},
  setPalette: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [palette, setPaletteState] = useState<Palette>('green')

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

  return (
    <ThemeCtx.Provider value={{ theme, palette, setTheme, setPalette }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
