import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { IndexabilityLevel, usePersonSEO } from '@/hooks/usePersonSEO'
import { Loader2, Globe, Link2, Lock, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface IndexabilitySettingsProps {
  personId: string
  personName: string
}

export function IndexabilitySettings({ personId, personName }: IndexabilitySettingsProps) {
  const { settings, isLoading, updateSettings, isUpdating } = usePersonSEO(personId)
  
  const [formData, setFormData] = useState({
    indexability: 'private' as IndexabilityLevel,
    ogTitle: '',
    ogDescription: '',
    ogImageUrl: ''
  })
  
  useEffect(() => {
    if (settings) {
      setFormData({
        indexability: settings.indexability,
        ogTitle: settings.ogTitle || '',
        ogDescription: settings.ogDescription || '',
        ogImageUrl: settings.ogImageUrl || ''
      })
    }
  }, [settings])
  
  const handleSave = () => {
    updateSettings(formData)
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  
  const canonicalUrl = settings?.slug ? `${window.location.origin}/p/${settings.slug}` : ''
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy & Search Engine Visibility</CardTitle>
        <CardDescription>
          Control who can access this page and whether it appears in search engines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Indexability Level</Label>
          <RadioGroup
            value={formData.indexability}
            onValueChange={(value) => setFormData({ ...formData, indexability: value as IndexabilityLevel })}
          >
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="private" id="private" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="private" className="flex items-center gap-2 font-medium cursor-pointer">
                  <Lock className="h-4 w-4" />
                  Private
                </Label>
                <p className="text-sm text-muted-foreground">
                  Requires authentication. Hidden from search engines.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="unlisted" id="unlisted" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="unlisted" className="flex items-center gap-2 font-medium cursor-pointer">
                  <Link2 className="h-4 w-4" />
                  Unlisted
                </Label>
                <p className="text-sm text-muted-foreground">
                  Anyone with the link can view. Hidden from search engines.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="public_indexable" id="public_indexable" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="public_indexable" className="flex items-center gap-2 font-medium cursor-pointer">
                  <Globe className="h-4 w-4" />
                  Public & Searchable
                </Label>
                <p className="text-sm text-muted-foreground">
                  Public and indexed by search engines. Appears in sitemap.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        {canonicalUrl && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Canonical URL: <code className="text-xs">{canonicalUrl}</code>
            </AlertDescription>
          </Alert>
        )}
        
        {formData.indexability === 'public_indexable' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="og-title">Social Media Title (Optional)</Label>
              <Input
                id="og-title"
                placeholder={`${personName} | Life Page`}
                value={formData.ogTitle}
                onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Custom title for social media previews
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="og-description">Social Media Description (Optional)</Label>
              <Textarea
                id="og-description"
                placeholder={`Explore the life story of ${personName}`}
                value={formData.ogDescription}
                onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Custom description for social media previews (recommended 150-160 characters)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="og-image">Social Media Image URL (Optional)</Label>
              <Input
                id="og-image"
                placeholder="https://..."
                value={formData.ogImageUrl}
                onChange={(e) => setFormData({ ...formData, ogImageUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Custom image for social media previews (defaults to profile photo)
              </p>
            </div>
          </div>
        )}
        
        <Button 
          onClick={handleSave} 
          disabled={isUpdating}
          className="w-full"
        >
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  )
}
