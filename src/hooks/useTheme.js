import { useEffect, useState } from 'react'

const THEME_KEY = 'ruta-tema'

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialPreference() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved
  } catch {}
  return 'system'
}

export function useTheme() {
  const [preference, setPreference] = useState(getInitialPreference)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const theme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(THEME_KEY, preference) } catch {}
  }, [theme, preference])

  return { theme, preference, setPreference, isDark: theme === 'dark' }
}
