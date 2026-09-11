import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'knkone.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
}

/** Vor dem ersten Rendern aufrufen, damit eine gespeicherte Wahl ohne Aufblitzen gilt. */
export function applyStoredTheme() {
  const theme = storedTheme()
  if (theme) document.documentElement.dataset.theme = theme
}

/** Aktuelles Design; ohne eigene Wahl folgt es dem Betriebssystem, eine Wahl wird im Browser gespeichert. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => storedTheme() ?? systemTheme())

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    const onChange = () => {
      if (!storedTheme()) setTheme(query.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
    setTheme(next)
  }

  return { theme, toggleTheme }
}
