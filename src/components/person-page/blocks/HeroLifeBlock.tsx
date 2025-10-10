import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Camera, Edit2, MapPin, Sparkles } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface HeroLifeBlockProps {
  person: {
    id: string
    full_name: string
    preferred_name?: string
    avatar_url?: string
    bio?: string
    birth_date?: string
  }
  blockContent: {
    tagline?: string
    city?: string
    current_interests?: string[]
    theme?: string
  }
  canEdit: boolean
  onUpdate?: () => void
}

const THEME_OPTIONS = [
  { value: 'vibrant', label: 'Vibrant', gradient: 'from-blue-500 to-purple-500' },
  { value: 'calm', label: 'Calm', gradient: 'from-teal-400 to-cyan-400' },
  { value: 'warm', label: 'Warm', gradient: 'from-orange-400 to-pink-400' },
  { value: 'nature', label: 'Nature', gradient: 'from-green-500 to-emerald-500' }
]

export default function HeroLifeBlock({ person, blockContent, canEdit, onUpdate }: HeroLifeBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    tagline: blockContent.tagline || '',
    city: blockContent.city || '',
    current_interests: blockContent.current_interests || [],
    theme: blockContent.theme || 'vibrant'
  })
  const [newInterest, setNewInterest] = useState('')

  const displayName = person.preferred_name || person.full_name
  const currentTheme = THEME_OPTIONS.find(t => t.value === formData.theme) || THEME_OPTIONS[0]

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
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

      // Optimize image before upload
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
        title: 'Avatar updated',
        description: 'Your profile picture has been updated'
      })

      onUpdate?.()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to update avatar',
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

          // Resize to max 800px width while maintaining aspect ratio
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
            0.85 // 85% quality
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
        .eq('type', 'hero')

      if (error) throw error

      toast({
        title: 'Hero updated',
        description: 'Your changes have been saved'
      })

      setIsEditing(false)
      onUpdate?.()
    } catch (error) {
      console.error('Error saving hero:', error)
      toast({
        title: 'Save failed',
        description: 'Failed to update hero section',
        variant: 'destructive'
      })
    }
  }

  const addInterest = () => {
    if (newInterest.trim() && formData.current_interests.length < 8) {
      setFormData({
        ...formData,
        current_interests: [...formData.current_interests, newInterest.trim()]
      })
      setNewInterest('')
    }
  }

  const removeInterest = (index: number) => {
    setFormData({
      ...formData,
      current_interests: formData.current_interests.filter((_, i) => i !== index)
    })
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg p-8",
      "bg-gradient-to-br",
      currentTheme.gradient
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent)]" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Avatar Section */}
        <div className="relative group">
          <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
            <AvatarImage src={person.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="text-3xl bg-white text-gray-700">
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

        {/* Content Section */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-bold text-white mb-2">
            {displayName}
          </h1>
          
          <p className="text-white/90 text-lg mb-1">
            {formData.tagline || person.bio || "This is me—today."}
          </p>

          {formData.city && (
            <div className="flex items-center gap-2 text-white/80 justify-center md:justify-start mb-4">
              <MapPin className="h-4 w-4" />
              <span>{formData.city}</span>
            </div>
          )}

          {/* Current Interests */}
          {formData.current_interests.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2 text-white/80">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">What I'm into now:</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {formData.current_interests.map((interest, idx) => (
                  <Badge 
                    key={idx}
                    variant="secondary"
                    className="bg-white/90 text-gray-700 hover:bg-white"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Button */}
        {canEdit && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Hero
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Hero Section</DialogTitle>
                <DialogDescription>
                  Customize your life page hero
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Tagline</Label>
                  <Input
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="This is me—today."
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Where you live"
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label>Current Interests (up to 8)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                      placeholder="Add an interest"
                      maxLength={30}
                    />
                    <Button onClick={addInterest} disabled={formData.current_interests.length >= 8}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.current_interests.map((interest, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeInterest(idx)}
                      >
                        {interest} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Theme</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {THEME_OPTIONS.map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => setFormData({ ...formData, theme: theme.value })}
                        className={cn(
                          "p-3 rounded-lg bg-gradient-to-br transition-all",
                          theme.gradient,
                          formData.theme === theme.value 
                            ? "ring-2 ring-primary ring-offset-2" 
                            : "opacity-60 hover:opacity-100"
                        )}
                      >
                        <span className="text-white text-xs font-medium">{theme.label}</span>
                      </button>
                    ))}
                  </div>
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