import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export type LayoutType = 'magazine' | 'linear' | 'card_stack'
export type ShapeLanguage = 'rounded' | 'soft' | 'sharp'

export interface ThemePalette {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
}

export interface ThemeConfig {
  id?: string
  name?: string
  palette: ThemePalette
  fontScale: number
  shape: ShapeLanguage
  layout: LayoutType
  highContrastMode: boolean
  customCss?: Record<string, any>
}

export interface ThemePreset {
  id: string
  name: string
  description: string
  palette: ThemePalette
  fontScale: number
  shape: ShapeLanguage
  layout: LayoutType
  highContrastMode: boolean
}

export function useThemePresets() {
  return useQuery({
    queryKey: ['theme-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('theme_presets' as any)
        .select('*')
        .order('name') as any

      if (error) throw error
      
      return (data || []).map((preset: any) => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        palette: preset.palette,
        fontScale: preset.font_scale,
        shape: preset.shape,
        layout: preset.layout,
        highContrastMode: preset.high_contrast_mode
      })) as ThemePreset[]
    }
  })
}

export function useThemeCustomizer(personId: string, initialThemeId?: string) {
  const queryClient = useQueryClient()
  const [previewTheme, setPreviewTheme] = useState<ThemeConfig | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Default theme that matches the design system
  const defaultTheme: ThemeConfig = {
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

  const { data: currentTheme, isLoading } = useQuery({
    queryKey: ['person-theme', personId, initialThemeId],
    queryFn: async () => {
      if (!initialThemeId) return defaultTheme

      const { data, error } = await supabase
        .from('person_page_themes' as any)
        .select('*')
        .eq('id', initialThemeId)
        .single() as any

      if (error) throw error
      
      return {
        id: data.id,
        name: data.name,
        palette: data.palette,
        fontScale: data.font_scale || 1.0,
        shape: data.shape || 'rounded',
        layout: data.layout || 'magazine',
        highContrastMode: data.high_contrast_mode || false,
        customCss: data.custom_css || {}
      } as ThemeConfig
    }
  })

  // Initialize preview with current theme
  useEffect(() => {
    if (currentTheme && !previewTheme) {
      setPreviewTheme(currentTheme)
    }
  }, [currentTheme])

  const updatePreview = (updates: Partial<ThemeConfig>) => {
    // Use current theme as base if previewTheme isn't set yet
    const baseTheme = previewTheme || currentTheme || defaultTheme
    const newTheme = { ...baseTheme, ...updates }
    console.log('🔧 Preview theme update:', { baseTheme, updates, newTheme })
    setPreviewTheme(newTheme)
    setIsPreviewMode(true)
  }

  const resetPreview = () => {
    setPreviewTheme(currentTheme)
    setIsPreviewMode(false)
  }

  const applyPreset = (preset: ThemePreset) => {
    updatePreview({
      palette: preset.palette,
      fontScale: preset.fontScale,
      shape: preset.shape,
      layout: preset.layout,
      highContrastMode: preset.highContrastMode
    })
  }

  const saveTheme = useMutation({
    mutationFn: async (theme: ThemeConfig) => {
      // Atomic update: create or update theme
      let themeId = theme.id || initialThemeId

      if (themeId) {
        // Update existing theme
        const { error } = await supabase
          .from('person_page_themes' as any)
          .update({
            name: theme.name || 'Custom Theme',
            palette: theme.palette,
            font_scale: theme.fontScale,
            shape: theme.shape,
            layout: theme.layout,
            high_contrast_mode: theme.highContrastMode,
            custom_css: theme.customCss || {},
            updated_at: new Date().toISOString()
          })
          .eq('id', themeId) as any

        if (error) throw error
      } else {
        // Create new theme
        const { data, error } = await supabase
          .from('person_page_themes' as any)
          .insert({
            name: theme.name || 'Custom Theme',
            palette: theme.palette,
            font_scale: theme.fontScale,
            shape: theme.shape,
            layout: theme.layout,
            high_contrast_mode: theme.highContrastMode,
            custom_css: theme.customCss || {}
          })
          .select()
          .single() as any

        if (error) throw error
        themeId = data.id

        // Link theme to person
        await supabase
          .from('people' as any)
          .update({ theme_id: themeId })
          .eq('id', personId) as any
      }

      return themeId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-theme', personId] })
      queryClient.invalidateQueries({ queryKey: ['person-page', personId] })
      setIsPreviewMode(false)
      toast.success('Theme saved successfully')
    },
    onError: (error) => {
      console.error('Failed to save theme:', error)
      toast.error('Failed to save theme. Changes have been reverted.')
      resetPreview()
    }
  })

  return {
    currentTheme: isPreviewMode ? previewTheme : currentTheme,
    isLoading,
    isPreviewMode,
    updatePreview,
    resetPreview,
    applyPreset,
    saveTheme: (theme: ThemeConfig) => saveTheme.mutate(theme),
    isSaving: saveTheme.isPending
  }
}
