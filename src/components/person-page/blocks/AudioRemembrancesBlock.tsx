import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/design-system/EmptyState'
import { Mic, Volume2 } from 'lucide-react'
import { RecordingFlow } from './audio-remembrances/RecordingFlow'
import { AudioCard } from './audio-remembrances/AudioCard'

interface AudioRemembrancesBlockProps {
  personId: string
  familyId: string
  blockContent?: any
  canEdit: boolean
  onUpdate?: () => void
}

export default function AudioRemembrancesBlock({
  personId,
  familyId,
  blockContent,
  canEdit,
  onUpdate
}: AudioRemembrancesBlockProps) {
  const [showRecording, setShowRecording] = useState(false)

  // Fetch person data
  const { data: person } = useQuery({
    queryKey: ['person', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select('id, given_name, surname, avatar_url')
        .eq('id', personId)
        .single()

      if (error) throw error
      return data
    }
  })

  // Fetch audio remembrances for this specific person
  const { data: recordings, isLoading, refetch } = useQuery({
    queryKey: ['audio-remembrances', personId],
    queryFn: async () => {
      // 1) Directly assigned recordings via tribute_id
      const { data: direct, error: directErr } = await supabase
        .from('audio_recordings')
        .select(`
          *,
          profiles:created_by (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('family_id', familyId)
        .eq('tribute_id', personId)
        .eq('is_draft', false)
        .in('status', ['completed', 'ready', 'processing'])
        .order('created_at', { ascending: false })

      if (directErr) throw directErr

      // 2) Recordings linked via stories -> person_story_links
      const { data: storyLinks, error: linkErr } = await supabase
        .from('person_story_links')
        .select('story_id')
        .eq('person_id', personId)

      if (linkErr) throw linkErr

      let byStory: typeof direct = []
      const storyIds = (storyLinks || []).map((l: any) => l.story_id).filter(Boolean)

      if (storyIds.length > 0) {
        const { data, error } = await supabase
          .from('audio_recordings')
          .select(`
            *,
            profiles:created_by (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('family_id', familyId)
          .in('story_id', storyIds)
          .eq('is_draft', false)
          .in('status', ['completed', 'ready', 'processing'])
          .order('created_at', { ascending: false })
        if (error) throw error
        byStory = data || []
      }

      // Merge + dedupe
      const map = new Map<string, any>()
      for (const r of [...(direct || []), ...byStory]) {
        map.set(r.id, r)
      }
      return Array.from(map.values())
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Loading remembrances...
        </div>
      </div>
    )
  }

  if (!recordings || recordings.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Volume2 className="h-6 w-6" />}
          title="No audio remembrances yet"
          description="Record a 60–120s tribute. Speak from the heart."
          action={{
            label: "Record Memory",
            onClick: () => setShowRecording(true),
            variant: "default"
          }}
        />
        {showRecording && (
          <RecordingFlow
            open={showRecording}
            onOpenChange={setShowRecording}
            personId={personId}
            familyId={familyId}
            onSuccess={() => {
              refetch()
              onUpdate?.()
            }}
          />
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold">
            Audio Remembrances
          </h3>
          <p className="text-sm text-muted-foreground">
            {recordings.length} {recordings.length === 1 ? 'memory' : 'memories'} shared
          </p>
        </div>
        <Button
          onClick={() => setShowRecording(true)}
          className="gap-2"
        >
          <Mic className="h-4 w-4" />
          Record Memory
        </Button>
      </div>

      {/* Audio Cards Stack */}
      <div className="space-y-4">
        {recordings.map((recording) => (
          <AudioCard
            key={recording.id}
            recording={recording}
            person={person}
            familyId={familyId}
            canEdit={canEdit}
            onUpdate={() => {
              refetch()
              onUpdate?.()
            }}
          />
        ))}
      </div>

      {/* Recording Dialog */}
      {showRecording && (
        <RecordingFlow
          open={showRecording}
          onOpenChange={setShowRecording}
          personId={personId}
          familyId={familyId}
          onSuccess={() => {
            refetch()
            onUpdate?.()
          }}
        />
      )}
    </div>
  )
}
