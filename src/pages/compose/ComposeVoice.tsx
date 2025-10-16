import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import VoiceStoryForm from '@/components/story-create/VoiceStoryForm'
import { supabase } from '@/lib/supabase'
import type { ComposerPrefillData } from '@/pages/stories/StoryNew'
import type { ComposerState } from '@/hooks/useComposerState'

interface ComposeVoiceProps {
  prefillData?: ComposerPrefillData
  standalone?: boolean
  composerState?: ComposerState
  updateState?: (updates: Partial<ComposerState>) => void
}

export default function ComposeVoice({ 
  prefillData, 
  standalone = true,
  composerState,
  updateState
}: ComposeVoiceProps) {
  const navigate = useNavigate()
  const [familyId, setFamilyId] = useState<string | null>(null)
  
  useEffect(() => {
    const getFamilyId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()
        
        if (member) {
          setFamilyId(member.family_id)
        }
      }
    }
    getFamilyId()
  }, [])

  if (!familyId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    )
  }

  const content_ui = <VoiceStoryForm familyId={familyId} />

  if (!standalone) {
    return content_ui
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Record Voice Story</h1>
          <p className="text-muted-foreground">
            Share your story through audio recording
          </p>
        </div>
        {content_ui}
      </main>
    </div>
  )
}
