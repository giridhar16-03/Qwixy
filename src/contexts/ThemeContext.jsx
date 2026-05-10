import { createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const theme = 'light'

  useEffect(() => {
    document.documentElement.dataset.theme = 'light'
    document.documentElement.classList.remove('dark')
  }, [])

  const toggleTheme = () => {
    // no-op: theme is light-only
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
