import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Edit2, Save, X, Plus } from 'lucide-react'
import { Person, UserRole, canEdit, initials } from '@/utils/personUtils'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import maleDefaultAvatar from '@/assets/avatar-male-default.png'
import femaleDefaultAvatar from '@/assets/avatar-female-default.png'

interface PortraitAboutProps {
  person: Person
  userRole: UserRole
  onPersonUpdated: () => void
}

const FAVORITE_CATEGORIES = [
  { key: 'music', label: 'Music' },
  { key: 'foods', label: 'Foods' },
  { key: 'places', label: 'Places' },
  { key: 'books', label: 'Books' },
  { key: 'sports', label: 'Sports' }
] as const

export function PortraitAbout({ person, userRole, onPersonUpdated }: PortraitAboutProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editBio, setEditBio] = useState(person.bio || '')
  const [editFavorites, setEditFavorites] = useState(person.favorites || {})
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  
  const canUserEdit = canEdit(userRole)

  // Get default avatar based on gender
  const getDefaultAvatar = () => {
    if (person.gender?.toLowerCase() === 'female' || person.gender?.toLowerCase() === 'f') {
      return femaleDefaultAvatar
    }
    return maleDefaultAvatar // Default to male avatar for unknown/male genders
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('people')
        .update({
          bio: editBio.trim() || null,
          favorites: editFavorites
        })
        .eq('id', person.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Profile updated successfully"
      })
      
      setIsEditing(false)
      onPersonUpdated()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditBio(person.bio || '')
    setEditFavorites(person.favorites || {})
    setIsEditing(false)
  }

  const addFavoriteItem = (category: string) => {
    setEditFavorites(prev => ({
      ...prev,
      [category]: [...(prev[category as keyof typeof prev] || []), '']
    }))
  }

  const updateFavoriteItem = (category: string, index: number, value: string) => {
    setEditFavorites(prev => ({
      ...prev,
      [category]: (prev[category as keyof typeof prev] || []).map((item, i) => 
        i === index ? value : item
      )
    }))
  }

  const removeFavoriteItem = (category: string, index: number) => {
    setEditFavorites(prev => ({
      ...prev,
      [category]: (prev[category as keyof typeof prev] || []).filter((_, i) => i !== index)
    }))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage 
              src={person.avatar_url || undefined} 
              onError={(e) => {
                // Fallback to gender-specific default if profile photo fails
                const target = e.currentTarget as HTMLImageElement
                target.onerror = null
                target.src = getDefaultAvatar()
              }}
            />
            <AvatarImage src={getDefaultAvatar()} />
            <AvatarFallback className="text-lg">
              {initials(person.full_name)}
            </AvatarFallback>
          </Avatar>
          About {person.given_name || person.full_name}
        </CardTitle>
        
        {canUserEdit && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        
        {isEditing && (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Bio Section */}
        <div>
          <h4 className="font-medium mb-2">Bio</h4>
          {isEditing ? (
            <Textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Share a bit about this person..."
              rows={3}
            />
          ) : (
            <p className="text-muted-foreground">
              {person.bio || 'No bio added yet.'}
            </p>
          )}
        </div>

        {/* Favorites Section */}
        <div>
          <h4 className="font-medium mb-4">Favorites</h4>
          <div className="space-y-4">
            {FAVORITE_CATEGORIES.map(({ key, label }) => {
              const items = (isEditing ? editFavorites : person.favorites)?.[key] || []
              
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-muted-foreground">{label}</h5>
                    {isEditing && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => addFavoriteItem(key)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-2">
                      {items.map((item: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={item}
                            onChange={(e) => updateFavoriteItem(key, index, e.target.value)}
                            placeholder={`Add ${label.toLowerCase()}...`}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeFavoriteItem(key, index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {items.length > 0 ? (
                        items.map((item: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {item}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No {label.toLowerCase()} added yet
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}