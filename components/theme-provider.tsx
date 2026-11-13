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
export type Skin =
  | 'classic'
  | 'glass'
  | 'panda'
  | 'pixel'
  | 'paper'
  | 'flat'

const THEME_KEY = 'goodcook-theme'
const PALETTE_KEY = 'goodcook-palette'
const SCALE_KEY = 'goodcook-scale'
const SKIN_KEY = 'goodcook-skin'
const NAV_ALPHA_KEY = 'goodcook-nav-alpha'
const SCALE_VALUE: Record<UiScale, string> = { sm: '0.92', md: '', lg: '1.08' }

function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  // 让原生控件、滚动条、输入框跟随明暗
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  syncThemeColor()
}

/**
 * 同步 theme-color：iOS Safari 的顶栏、Android Chrome 的状态栏都读这个值。
 * 换主题/换皮肤后重算，避免系统浅色但应用深色时顶栏还是白的。
 */
function syncThemeColor() {
  try {
    const base = getComputedStyle(document.documentElement)
      .getPropertyValue('--mf-base')
      .trim()
    if (!base) return
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute('content', base))
  } catch {
    // 拿不到计算值就算了，不影响页面
  }
}

/** 当前存的是「跟随系统」吗（直接读存储，避免闭包里的旧值） */
function isSystemMode() {
  return ((localStorage.getItem('goodcook-theme') as Theme) || 'system') === 'system'
}

function applyPalette(palette: Palette) {
  document.documentElement.dataset.theme = palette
  syncThemeColor()
}

function applyNavAlpha(alpha: number) {
  document.documentElement.style.setProperty('--mf-nav-alpha', `${alpha}%`)
}

function applySkin(skin: Skin) {
  if (skin === 'classic') delete document.documentElement.dataset.skin
  else document.documentElement.dataset.skin = skin
  syncThemeColor()
}

function applyScale(scale: UiScale) {
  // 整页缩放：文字与间距等比变化，手机与电脑表现一致
  document.documentElement.style.zoom = SCALE_VALUE[scale]
}

const ThemeCtx = createContext<{
  theme: Theme
  palette: Palette
  scale: UiScale
  skin: Skin
  navAlpha: number
  setTheme: (t: Theme) => void
  setPalette: (p: Palette) => void
  setScale: (s: UiScale) => void
  setSkin: (s: Skin) => void
  setNavAlpha: (n: number) => void
}>({
  theme: 'system',
  palette: 'green',
  scale: 'md',
  skin: 'classic',
  navAlpha: 88,
  setTheme: () => {},
  setPalette: () => {},
  setScale: () => {},
  setSkin: () => {},
  setNavAlpha: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [palette, setPaletteState] = useState<Palette>('green')
  const [scale, setScaleState] = useState<UiScale>('md')
  const [skin, setSkinState] = useState<Skin>('classic')
  const [navAlpha, setNavAlphaState] = useState(88)

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

    const savedSkin = (localStorage.getItem(SKIN_KEY) as Skin) || 'classic'
    setSkinState(savedSkin)
    applySkin(savedSkin)

    const savedAlpha = Number(localStorage.getItem(NAV_ALPHA_KEY) ?? '88')
    const alpha = Number.isFinite(savedAlpha)
      ? Math.min(100, Math.max(25, savedAlpha))
      : 88
    setNavAlphaState(alpha)
    applyNavAlpha(alpha)

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

  const setSkin = useCallback((sk: Skin) => {
    localStorage.setItem(SKIN_KEY, sk)
    setSkinState(sk)
    applySkin(sk)
    // 风格自带配色，切回默认时恢复原配色
    applyPalette((localStorage.getItem(PALETTE_KEY) as Palette) || 'green')
  }, [])

  const setNavAlpha = useCallback((n: number) => {
    const v = Math.min(100, Math.max(25, Math.round(n)))
    localStorage.setItem(NAV_ALPHA_KEY, String(v))
    setNavAlphaState(v)
    applyNavAlpha(v)
  }, [])

  const setScale = useCallback((sc: UiScale) => {
    localStorage.setItem(SCALE_KEY, sc)
    setScaleState(sc)
    applyScale(sc)
  }, [])

  return (
    <ThemeCtx.Provider
      value={{
        theme,
        palette,
        scale,
        skin,
        navAlpha,
        setTheme,
        setPalette,
        setScale,
        setSkin,
        setNavAlpha,
      }}
    >
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
