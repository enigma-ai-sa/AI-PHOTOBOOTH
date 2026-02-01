"use client"

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { EventTheme } from '@/lib/supabase'

interface ThemeContextType {
  theme: EventTheme | null
  applyTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ 
  theme,
  children 
}: { 
  theme: EventTheme | null
  children: ReactNode 
}) {
  const applyTheme = () => {
    if (!theme) return
    
    const root = document.documentElement
    
    // Apply CSS custom properties
    root.style.setProperty('--color-gradient-green-start', theme.primary_color)
    root.style.setProperty('--color-gradient-green-end', theme.secondary_color)
    root.style.setProperty('--color-gradient-blue-start', theme.primary_color)
    root.style.setProperty('--color-gradient-blue-end', theme.secondary_color)
    
    if (theme.accent_color) {
      root.style.setProperty('--color-accent', theme.accent_color)
    }
    
    if (theme.background_gradient_start) {
      root.style.setProperty('--bg-gradient-start', theme.background_gradient_start)
    }
    
    if (theme.background_gradient_end) {
      root.style.setProperty('--bg-gradient-end', theme.background_gradient_end)
    }
    
    if (theme.font_family) {
      root.style.setProperty('--font-family', theme.font_family)
    }
  }

  useEffect(() => {
    applyTheme()
    
    // Cleanup on unmount - reset to defaults
    return () => {
      const root = document.documentElement
      root.style.removeProperty('--color-gradient-green-start')
      root.style.removeProperty('--color-gradient-green-end')
      root.style.removeProperty('--color-gradient-blue-start')
      root.style.removeProperty('--color-gradient-blue-end')
      root.style.removeProperty('--color-accent')
      root.style.removeProperty('--bg-gradient-start')
      root.style.removeProperty('--bg-gradient-end')
      root.style.removeProperty('--font-family')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
