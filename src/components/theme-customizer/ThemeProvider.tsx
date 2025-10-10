import { ReactNode, useEffect } from 'react'
import { ThemeConfig } from '@/hooks/useThemeCustomizer'

interface ThemeProviderProps {
  theme: ThemeConfig | null
  children: ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  useEffect(() => {
    if (!theme) return

    const root = document.documentElement
    
    // Apply color palette
    root.style.setProperty('--primary', theme.palette.primary)
    root.style.setProperty('--secondary', theme.palette.secondary)
    root.style.setProperty('--accent', theme.palette.accent)
    root.style.setProperty('--background', theme.palette.background)
    root.style.setProperty('--foreground', theme.palette.foreground)
    
    // Apply font scale
    const baseFontSize = 16 * theme.fontScale
    root.style.setProperty('--font-scale', theme.fontScale.toString())
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
    
    const radii = borderRadius[theme.shape]
    root.style.setProperty('--radius-sm', radii.sm)
    root.style.setProperty('--radius-md', radii.md)
    root.style.setProperty('--radius-lg', radii.lg)
    root.style.setProperty('--radius-xl', radii.xl)
    root.style.setProperty('--radius', radii.md) // default
    
    // Apply high contrast mode
    if (theme.highContrastMode) {
      root.classList.add('high-contrast')
      
      // Enhance contrast for text and UI elements
      root.style.setProperty('--foreground', '0 0 0')
      root.style.setProperty('--muted-foreground', '0 0 20')
      root.style.setProperty('--border', '0 0 30')
    } else {
      root.classList.remove('high-contrast')
    }
    
    // Apply layout class
    root.setAttribute('data-layout', theme.layout)
    
    // Apply custom CSS if provided
    if (theme.customCss && Object.keys(theme.customCss).length > 0) {
      Object.entries(theme.customCss).forEach(([property, value]) => {
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
