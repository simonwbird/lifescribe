import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Music, Utensils, MessageSquareQuote, Palette, Edit } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface FavoritesQuirksProps {
  personId: string
  familyId: string
  canEdit?: boolean
  onUpdate?: () => void
  className?: string
}

interface FavoritesData {
  favorite_song?: string | null
  favorite_food?: string | null
  signature_saying?: string | null
  hobbies?: string[] | null
}

export function FavoritesQuirks({ 
  personId, 
  familyId, 
  canEdit, 
  onUpdate,
  className 
}: FavoritesQuirksProps) {
  const [data, setData] = useState<FavoritesData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: personData, error } = await supabase
          .from('people')
          .select('favorite_song, favorite_food, signature_saying, hobbies')
          .eq('id', personId)
          .single()

        if (error) throw error
        setData(personData || {})
      } catch (error) {
        console.error('Error fetching favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to changes
    const channel = supabase
      .channel('people-favorites-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'people',
          filter: `id=eq.${personId}`
        },
        (payload) => {
          setData({
            favorite_song: payload.new.favorite_song,
            favorite_food: payload.new.favorite_food,
            signature_saying: payload.new.signature_saying,
            hobbies: payload.new.hobbies
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [personId])

  const handleItemClick = async (field: string, value: string) => {
    // Search for stories that mention this item
    const searchTerm = value.toLowerCase()
    
    try {
      const { data: stories } = await supabase
        .from('stories')
        .select('id, title')
        .eq('family_id', familyId)
        .contains('linked_people', [personId])
        .ilike('content', `%${searchTerm}%`)
        .limit(5)

      if (stories && stories.length > 0) {
        // Scroll to stories section
        const storiesSection = document.getElementById('stories')
        if (storiesSection) {
          storiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    } catch (error) {
      console.error('Error searching stories:', error)
    }
  }

  const items = [
    {
      icon: Music,
      emoji: '🎵',
      label: 'Favorite Song',
      value: data.favorite_song,
      field: 'favorite_song'
    },
    {
      icon: Utensils,
      emoji: '🍽️',
      label: 'Favorite Food',
      value: data.favorite_food,
      field: 'favorite_food'
    },
    {
      icon: MessageSquareQuote,
      emoji: '💬',
      label: 'Signature Saying',
      value: data.signature_saying,
      field: 'signature_saying'
    }
  ]

  // Add hobbies (max 4)
  const hobbies = data.hobbies?.slice(0, 4) || []
  const hobbyItems = hobbies.map((hobby, index) => ({
    icon: Palette,
    emoji: ['🎨', '⚽', '📚', '🎮'][index] || '✨',
    label: 'Hobby',
    value: hobby,
    field: `hobby_${index}`
  }))

  const allItems = [...items, ...hobbyItems].filter(item => item.value)

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Favorites & Quirks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-muted rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (allItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Favorites & Quirks
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="text-center py-4">
            <p className="mb-3">Add favorite things and memorable quirks</p>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={onUpdate}>
                <Edit className="h-3 w-3 mr-2" />
                Add Favorites
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Favorites & Quirks
          </CardTitle>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={onUpdate}>
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {allItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={`${item.field}-${index}`}
              onClick={() => handleItemClick(item.field, item.value!)}
              className="w-full flex items-start gap-2 text-left p-2 rounded-md hover:bg-accent transition-colors group text-sm"
            >
              <span className="text-base shrink-0 mt-0.5" aria-hidden="true">
                {item.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                <p className="font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {item.value}
                </p>
              </div>
            </button>
          )
        })}
        
        {allItems.length < 6 && canEdit && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs text-muted-foreground"
            onClick={onUpdate}
          >
            Add more favorites
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
