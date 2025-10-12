import { ReactNode, useEffect } from 'react'
import { ThemeConfig } from '@/hooks/useThemeCustomizer'

interface ThemeProviderProps {
  theme: ThemeConfig | null
  children: ReactNode
}

// Default theme values that match the index.css design system
const DEFAULT_THEME: ThemeConfig = {
  palette: {
    primary: '160 25% 35%',      // Heritage forest green
    secondary: '45 35% 92%',     // Heritage cream
    accent: '42 85% 55%',        // Heritage gold
    background: '45 35% 92%',    // Heritage cream
    foreground: '210 25% 15%'    // Neutral 900
  },
  fontScale: 1.0,
  shape: 'rounded',
  layout: 'magazine',
  highContrastMode: false
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  useEffect(() => {
    // Use default theme if none provided
    const activeTheme = theme || DEFAULT_THEME
    
    console.log('🎨 ThemeProvider: Applying theme', activeTheme)

    const root = document.documentElement
    
    // Apply color palette
    root.style.setProperty('--primary', activeTheme.palette.primary)
    root.style.setProperty('--secondary', activeTheme.palette.secondary)
    root.style.setProperty('--accent', activeTheme.palette.accent)
    root.style.setProperty('--background', activeTheme.palette.background)
    root.style.setProperty('--foreground', activeTheme.palette.foreground)
    
    // Apply font scale
    const baseFontSize = 16 * activeTheme.fontScale
    root.style.setProperty('--font-scale', activeTheme.fontScale.toString())
    root.style.fontSize = `${baseFontSize}px`
    
    // Apply shape language
    const borderRadius = {
      rounded: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem'
      },
      soft: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem'
      },
      sharp: {
        sm: '0.125rem',
        md: '0.125rem',
        lg: '0.25rem',
        xl: '0.25rem'
      }
    }
    
    const radii = borderRadius[activeTheme.shape]
    root.style.setProperty('--radius-sm', radii.sm)
    root.style.setProperty('--radius-md', radii.md)
    root.style.setProperty('--radius-lg', radii.lg)
    root.style.setProperty('--radius-xl', radii.xl)
    root.style.setProperty('--radius', radii.md) // default
    
    // Apply high contrast mode
    if (activeTheme.highContrastMode) {
      root.classList.add('high-contrast')
      
      // Enhance contrast for text and UI elements
      root.style.setProperty('--foreground', '0 0 0')
      root.style.setProperty('--muted-foreground', '0 0 20')
      root.style.setProperty('--border', '0 0 30')
    } else {
      root.classList.remove('high-contrast')
    }
    
    // Apply layout class
    root.setAttribute('data-layout', activeTheme.layout)
    
    // Apply custom CSS if provided
    if (activeTheme.customCss && Object.keys(activeTheme.customCss).length > 0) {
      Object.entries(activeTheme.customCss).forEach(([property, value]) => {
        root.style.setProperty(property, value as string)
      })
    }
    
    // Cleanup function
    return () => {
      root.style.fontSize = ''
      root.classList.remove('high-contrast')
      root.removeAttribute('data-layout')
    }
  }, [theme])

  return <>{children}</>
}
