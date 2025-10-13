import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Shuffle, Pencil, Mic, Camera } from 'lucide-react'
import { useMemorySpark } from '@/hooks/useMemorySpark'
import { CaptureMemoryModal } from '@/components/memory/CaptureMemoryModal'
import { RecentMemoriesStrip } from '@/components/memory/RecentMemoriesStrip'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/integrations/supabase/client'

interface MemorySparkCardProps {
  person: {
    id: string
    first_name?: string
    preferred_name?: string
    full_name?: string
    birth_date?: string
    death_date?: string
  }
  viewer?: {
    relationship_to_person?: string
  }
  context?: {
    type?: 'photo' | 'place' | 'date'
    place?: string
  }
}

export default function MemorySparkCard({ person, viewer, context }: MemorySparkCardProps) {
  const { user } = useAuth()
  const { currentSpark, interpolatedText, loading, shuffle } = useMemorySpark(person, viewer, context)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'text' | 'voice' | 'photo'>('text')
  const [recentMemories, setRecentMemories] = useState<any[]>([])
  const [loadingMemories, setLoadingMemories] = useState(true)
  
  const firstName = person.first_name || person.preferred_name || person.full_name?.split(' ')[0] || 'them'

  // Fetch recent approved memories
  useEffect(() => {
    async function loadRecentMemories() {
      try {
        const { data, error } = await supabase
          .from('memories')
          .select(`
            id,
            modality,
            title,
            body,
            audio_url,
            photo_url,
            created_at,
            contributor_name,
            contributor_user
          `)
          .eq('person_id', person.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) throw error

        // Fetch contributor profiles separately
        const contributorIds = (data || [])
          .map(m => m.contributor_user)
          .filter((id): id is string => id !== null)

        let profilesMap: Record<string, { full_name: string }> = {}

        if (contributorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', contributorIds)

          if (profiles) {
            profilesMap = profiles.reduce((acc, profile) => {
              acc[profile.id] = { full_name: profile.full_name }
              return acc
            }, {} as Record<string, { full_name: string }>)
          }
        }

        // Attach profile data
        const memoriesWithProfiles = (data || []).map(memory => ({
          ...memory,
          profiles: memory.contributor_user ? profilesMap[memory.contributor_user] : undefined
        }))

        setRecentMemories(memoriesWithProfiles)
      } catch (error) {
        console.error('Error loading recent memories:', error)
      } finally {
        setLoadingMemories(false)
      }
    }

    loadRecentMemories()
  }, [person.id])

  const handleCapture = (mode: 'text' | 'voice' | 'photo') => {
    setSelectedMode(mode)
    setModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    setModalOpen(open)
    
    // Reload memories when modal closes (in case a new one was added)
    if (!open) {
      setLoadingMemories(true)
      supabase
        .from('memories')
        .select(`
          id,
          modality,
          title,
          body,
          audio_url,
          photo_url,
          created_at,
          contributor_name,
          contributor_user
        `)
        .eq('person_id', person.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(3)
        .then(({ data }) => {
          if (data) {
            setRecentMemories(data)
          }
          setLoadingMemories(false)
        })
    }
  }

  if (loading) {
    return (
      <Card className="border-2 bg-background p-6" data-block="memory_spark">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-6 bg-muted rounded w-full" />
          <div className="h-10 bg-muted rounded w-1/4" />
        </div>
      </Card>
    )
  }

  if (!currentSpark || !interpolatedText) {
    return null
  }

  return (
    <>
      <Card className="border-2 bg-background p-6" data-block="memory_spark">
        <div className="space-y-4">
          <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Share a memory of {firstName}
          </div>
          
          <div className="text-xl font-medium leading-relaxed text-foreground">
            {interpolatedText}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => handleCapture('text')}
              className="flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Write
            </Button>
            
            <Button
              variant="outline"
              size="default"
              onClick={() => handleCapture('voice')}
              className="flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Record voice
            </Button>
            
            <Button
              variant="outline"
              size="default"
              onClick={() => handleCapture('photo')}
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Add photo
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={shuffle}
              className="ml-auto text-xs opacity-70 hover:opacity-100"
            >
              <Shuffle className="w-3 h-3 mr-1" />
              Show another spark
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            A few sentences is perfect. Add a year or place if you remember.
          </p>

          {/* Recent memories strip */}
          {!loadingMemories && recentMemories.length > 0 && (
            <RecentMemoriesStrip memories={recentMemories} />
          )}
        </div>
      </Card>

      <CaptureMemoryModal
        isOpen={modalOpen}
        onOpenChange={handleModalClose}
        person={person}
        prompt={interpolatedText || ''}
        promptId={currentSpark?.id}
        viewer={user ? { id: user.id, relationship_to_person: viewer?.relationship_to_person } : undefined}
      />
    </>
  )
}
