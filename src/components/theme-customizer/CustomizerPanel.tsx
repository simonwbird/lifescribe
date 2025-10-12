import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Palette, 
  Type, 
  Layout as LayoutIcon, 
  Square, 
  Save, 
  RotateCcw,
  Eye,
  Sparkles
} from 'lucide-react'
import { useThemeCustomizer, useThemePresets, ThemeConfig, LayoutType, ShapeLanguage } from '@/hooks/useThemeCustomizer'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'

interface CustomizerPanelProps {
  personId: string
  themeId?: string
  onClose?: () => void
}

export function CustomizerPanel({ personId, themeId, onClose }: CustomizerPanelProps) {
  const { 
    currentTheme, 
    isLoading, 
    isPreviewMode,
    updatePreview, 
    resetPreview, 
    applyPreset,
    saveTheme, 
    isSaving 
  } = useThemeCustomizer(personId, themeId)
  
  const { data: presets, isLoading: presetsLoading } = useThemePresets()
  
  const [customColors, setCustomColors] = useState({
    primary: currentTheme?.palette.primary || '160 25% 35%',
    secondary: currentTheme?.palette.secondary || '45 35% 92%',
    accent: currentTheme?.palette.accent || '42 85% 55%'
  })

  if (isLoading || !currentTheme) {
    return <div className="p-6">Loading theme...</div>
  }

  const handleSave = () => {
    if (currentTheme) {
      saveTheme(currentTheme)
    }
  }

  const handleColorChange = (key: keyof typeof customColors, value: string) => {
    const newColors = { ...customColors, [key]: value }
    console.log('🎨 Color change:', { key, value, currentPalette: currentTheme.palette })
    setCustomColors(newColors)
    updatePreview({
      palette: {
        ...currentTheme.palette,
        [key]: value
      }
    })
  }

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Theme Customizer
            </CardTitle>
            <CardDescription>
              Personalize the look and feel of this page
            </CardDescription>
          </div>
          {isPreviewMode && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Preview Mode
            </Badge>
          )}
        </div>
      </CardHeader>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <CardContent className="p-6 space-y-6">
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="presets">
                <Palette className="h-4 w-4 mr-2" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="colors">
                <Palette className="h-4 w-4 mr-2" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="typography">
                <Type className="h-4 w-4 mr-2" />
                Type
              </TabsTrigger>
              <TabsTrigger value="layout">
                <LayoutIcon className="h-4 w-4 mr-2" />
                Layout
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="space-y-4 pt-4">
              <div className="space-y-3">
                {presetsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading presets...</p>
                ) : (
                  presets?.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      onClick={() => applyPreset(preset)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex gap-1 mt-1">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ 
                              backgroundColor: `hsl(${preset.palette.primary})` 
                            }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ 
                              backgroundColor: `hsl(${preset.palette.secondary})` 
                            }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ 
                              backgroundColor: `hsl(${preset.palette.accent})` 
                            }}
                          />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {preset.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Primary Color (HSL)</Label>
                  <Input
                    id="primary"
                    value={customColors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    placeholder="222 47 11"
                  />
                  <div 
                    className="w-full h-12 rounded border"
                    style={{ backgroundColor: `hsl(${customColors.primary})` }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary">Secondary Color (HSL)</Label>
                  <Input
                    id="secondary"
                    value={customColors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    placeholder="217 91 4"
                  />
                  <div 
                    className="w-full h-12 rounded border"
                    style={{ backgroundColor: `hsl(${customColors.secondary})` }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent">Accent Color (HSL)</Label>
                  <Input
                    id="accent"
                    value={customColors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    placeholder="26 47 88"
                  />
                  <div 
                    className="w-full h-12 rounded border"
                    style={{ backgroundColor: `hsl(${customColors.accent})` }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Font Scale: {currentTheme.fontScale.toFixed(1)}x</Label>
                  <Slider
                    value={[currentTheme.fontScale]}
                    onValueChange={([value]) => updatePreview({ fontScale: value })}
                    min={0.8}
                    max={1.4}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust text size for better readability
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Shape Language</Label>
                  <RadioGroup
                    value={currentTheme.shape}
                    onValueChange={(value) => updatePreview({ shape: value as ShapeLanguage })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rounded" id="rounded" />
                      <Label htmlFor="rounded" className="font-normal cursor-pointer">
                        Rounded (Modern)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="soft" id="soft" />
                      <Label htmlFor="soft" className="font-normal cursor-pointer">
                        Soft (Gentle)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sharp" id="sharp" />
                      <Label htmlFor="sharp" className="font-normal cursor-pointer">
                        Sharp (Minimalist)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Page Layout</Label>
                  <RadioGroup
                    value={currentTheme.layout}
                    onValueChange={(value) => updatePreview({ layout: value as LayoutType })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="magazine" id="magazine" />
                      <Label htmlFor="magazine" className="font-normal cursor-pointer">
                        Magazine (Rich, visual)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="linear" id="linear" />
                      <Label htmlFor="linear" className="font-normal cursor-pointer">
                        Linear (Timeline style)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card_stack" id="card_stack" />
                      <Label htmlFor="card_stack" className="font-normal cursor-pointer">
                        Card Stack (Clean, organized)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label htmlFor="high-contrast">High Contrast Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Enhances readability (WCAG AA compliant)
                    </p>
                  </div>
                  <Switch
                    id="high-contrast"
                    checked={currentTheme.highContrastMode}
                    onCheckedChange={(checked) => updatePreview({ highContrastMode: checked })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {isPreviewMode && (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                You're previewing changes. Click "Save Theme" to apply them permanently.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </ScrollArea>

      <div className="border-t p-4 flex gap-2">
        {isPreviewMode && (
          <Button variant="outline" onClick={resetPreview} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !isPreviewMode}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Theme'}
        </Button>
      </div>
    </Card>
  )
}
