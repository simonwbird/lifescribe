import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Camera, Edit2, Heart } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface HeroMemorialBlockProps {
  person: {
    id: string
    full_name: string
    preferred_name?: string
    avatar_url?: string
    birth_date?: string
    death_date?: string
  }
  blockContent: {
    epitaph?: string
    ambient_background?: boolean
  }
  canEdit: boolean
  onUpdate?: () => void
}

export default function HeroMemorialBlock({ person, blockContent, canEdit, onUpdate }: HeroMemorialBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    epitaph: blockContent.epitaph || '',
    ambient_background: blockContent.ambient_background ?? true
  })

  const displayName = person.preferred_name || person.full_name

  const formatLifeDates = () => {
    if (!person.birth_date && !person.death_date) return null
    
    const birthYear = person.birth_date ? format(new Date(person.birth_date), 'yyyy') : '?'
    const deathYear = person.death_date ? format(new Date(person.death_date), 'yyyy') : '?'
    
    return `${birthYear} - ${deathYear}`
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive'
      })
      return
    }

    try {
      setUploading(true)

      // Optimize image
      const optimizedFile = await optimizeImage(file)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${person.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, optimizedFile, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      // Update person avatar
      const { error: updateError } = await supabase
        .from('people')
        .update({ avatar_url: publicUrl })
        .eq('id', person.id)

      if (updateError) throw updateError

      toast({
        title: 'Portrait updated',
        description: 'Memorial portrait has been updated'
      })

      onUpdate?.()
    } catch (error) {
      console.error('Error uploading portrait:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to update portrait',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Resize to max 800px width
          const maxWidth = 800
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimized = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                })
                resolve(optimized)
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            0.85
          )
        }
      }
    })
  }

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('person_page_blocks')
        .update({
          content_json: {
            ...blockContent,
            ...formData
          }
        })
        .eq('person_id', person.id)
        .eq('type', 'hero_memorial')

      if (error) throw error

      toast({
        title: 'Memorial updated',
        description: 'Your changes have been saved'
      })

      setIsEditing(false)
      onUpdate?.()
    } catch (error) {
      console.error('Error saving memorial:', error)
      toast({
        title: 'Save failed',
        description: 'Failed to update memorial section',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg p-8",
      formData.ambient_background 
        ? "bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-blue-900/20"
        : "bg-muted/50"
    )}>
      {/* Ambient Background Effect */}
      {formData.ambient_background && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
               style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" 
               style={{ animationDuration: '10s', animationDelay: '2s' }} />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center text-center gap-6">
        {/* Portrait */}
        <div className="relative group">
          <Avatar className="h-40 w-40 border-4 border-white shadow-2xl">
            <AvatarImage src={person.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="text-4xl bg-white text-gray-700">
              {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {canEdit && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="h-6 w-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4 fill-current" />
            <span className="text-sm">In Loving Memory</span>
          </div>

          <h1 className="text-4xl font-bold">
            {displayName}
          </h1>

          {formatLifeDates() && (
            <p className="text-xl text-muted-foreground">
              {formatLifeDates()}
            </p>
          )}

          {formData.epitaph && (
            <blockquote className="text-lg italic text-muted-foreground mt-4 border-l-4 border-primary pl-4">
              "{formData.epitaph}"
            </blockquote>
          )}

          {!person.death_date && canEdit && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Death date is required for memorial pages
              </p>
            </div>
          )}
        </div>

        {/* Edit Button */}
        {canEdit && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-4">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Memorial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Memorial Section</DialogTitle>
                <DialogDescription>
                  Customize the tribute page hero
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Epitaph / Quote</Label>
                  <Textarea
                    value={formData.epitaph}
                    onChange={(e) => setFormData({ ...formData, epitaph: e.target.value })}
                    placeholder="A memorable quote or epitaph..."
                    maxLength={250}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.epitaph.length}/250 characters
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Ambient Background</Label>
                    <p className="text-sm text-muted-foreground">
                      Gentle animated background effect
                    </p>
                  </div>
                  <Switch
                    checked={formData.ambient_background}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, ambient_background: checked })
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}