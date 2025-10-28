"use client"

import { useTheme } from "./ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getIcon = () => {
    if (theme === "system") {
      return actualTheme === "dark" ? "🌙" : "☀️"
    }
    return theme === "dark" ? "🌙" : "☀️"
  }

  const getLabel = () => {
    if (theme === "system") {
      return "시스템"
    }
    return theme === "dark" ? "다크" : "라이트"
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center space-x-2 px-3 py-2 rounded-md transition-colors hover:bg-bg-secondary"
      title={`현재 테마: ${getLabel()}`}
    >
      <span className="text-xl">{getIcon()}</span>
      <span className="text-sm text-text-secondary">{getLabel()}</span>
    </button>
  )
}
