import React, { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pencil, Sparkles, Link as LinkIcon, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'

interface BioSource {
  type: 'story' | 'photo'
  id: string
  title: string
}

interface BioContent {
  short_bio?: string
  long_bio?: string
  tone?: 'classic' | 'warm' | 'vivid'
  sources?: BioSource[]
}

interface BioOverviewBlockProps {
  personId: string
  familyId: string
  blockContent: BioContent
  canEdit: boolean
  onUpdate?: () => void
}

export default function BioOverviewBlock({
  personId,
  familyId,
  blockContent,
  canEdit,
  onUpdate
}: BioOverviewBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState<BioContent>({
    short_bio: blockContent.short_bio || '',
    long_bio: blockContent.long_bio || '',
    tone: blockContent.tone || 'warm',
    sources: blockContent.sources || []
  })

  const handleGenerateFromStories = async () => {
    setIsGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-bio', {
        body: { 
          personId,
          familyId,
          tone: formData.tone || 'warm'
        }
      })

      if (error) {
        console.error('Function error:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned from function')
      }

      setFormData(prev => ({
        ...prev,
        short_bio: data.short_bio || '',
        long_bio: data.long_bio || '',
        sources: data.sources || []
      }))

      toast({
        title: 'Biography generated',
        description: 'Review and edit the generated content before saving'
      })
    } catch (error: any) {
      console.error('Error generating bio:', error)
      
      let errorMessage = 'Failed to generate biography'
      if (error.message?.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.'
      } else if (error.message?.includes('402')) {
        errorMessage = 'AI credits depleted. Please add funds to continue.'
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('person_page_blocks')
        .update({
          content_json: formData as any,
          updated_at: new Date().toISOString()
        })
        .eq('person_id', personId)
        .eq('type', 'bio_overview')

      if (error) throw error

      toast({
        title: 'Bio saved',
        description: 'Biography has been updated'
      })
      setIsEditing(false)
      onUpdate?.()
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: 'Save failed',
        description: 'Could not save biography',
        variant: 'destructive'
      })
    }
  }

  const removeSource = (index: number) => {
    setFormData({
      ...formData,
      sources: formData.sources?.filter((_, i) => i !== index)
    })
  }

  const isEmpty = !blockContent.short_bio && !blockContent.long_bio

  if (isEmpty && !canEdit) {
    return null
  }

  if (isEmpty && canEdit) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground mb-4">
          Add a short bio so visitors meet the person, not just the dates.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Write Bio
          </Button>
          <Button variant="outline" onClick={() => {
            setIsEditing(true)
            handleGenerateFromStories()
          }}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate from stories
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {blockContent.short_bio && (
          <p className="text-lg font-medium leading-relaxed">
            {blockContent.short_bio}
          </p>
        )}

        {blockContent.long_bio && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{blockContent.long_bio}</ReactMarkdown>
          </div>
        )}

        {blockContent.sources && blockContent.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {blockContent.sources.map((source, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                <LinkIcon className="h-3 w-3" />
                {source.title}
              </Badge>
            ))}
          </div>
        )}

        {canEdit && (
          <div className="pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Bio
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Biography</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tone</Label>
              <Select
                value={formData.tone}
                onValueChange={(value: 'classic' | 'warm' | 'vivid') =>
                  setFormData({ ...formData, tone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="vivid">Vivid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Short Bio (40-160 characters for SEO)</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.short_bio?.length || 0}/160
                </span>
              </div>
              <Textarea
                value={formData.short_bio}
                onChange={(e) => {
                  if (e.target.value.length <= 160) {
                    setFormData({ ...formData, short_bio: e.target.value })
                  }
                }}
                placeholder="A brief summary for search engines and social media..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required when page is public and searchable
              </p>
            </div>

            <div>
              <Label>Long Bio (Markdown supported)</Label>
              <Textarea
                value={formData.long_bio}
                onChange={(e) => setFormData({ ...formData, long_bio: e.target.value })}
                placeholder="Write a longer biography with details, stories, and memories..."
                rows={12}
              />
            </div>

            {formData.sources && formData.sources.length > 0 && (
              <div>
                <Label>Sources</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sources.map((source, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      <LinkIcon className="h-3 w-3" />
                      {source.title}
                      <button
                        onClick={() => removeSource(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave}>Save Biography</Button>
              <Button
                variant="outline"
                onClick={handleGenerateFromStories}
                disabled={isGenerating}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate from stories'}
              </Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
