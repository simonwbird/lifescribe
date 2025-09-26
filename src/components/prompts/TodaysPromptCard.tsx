import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, BookOpen, Volume2, Shuffle, Sparkles, Mic, MessageCircle, PenTool } from 'lucide-react'
import { PromptInstance } from '@/hooks/usePrompts'
import PersonChip from './PersonChip'
import { ResponseModal } from './ResponseModal'
import { useNavigate } from 'react-router-dom'

interface TodaysPromptCardProps {
  promptInstance: PromptInstance | null
  onRespond: (instanceId: string) => void
  onBrowseAll: () => void
  people?: Array<{ id: string; full_name: string }> // For person chips
}

export default function TodaysPromptCard({ 
  promptInstance, 
  onRespond, 
  onBrowseAll,
  people = []
}: TodaysPromptCardProps) {
  const [showResponseModal, setShowResponseModal] = useState(false)
  const navigate = useNavigate()

  const handleResponseSelect = (type: 'voice' | 'text' | 'video') => {
    setShowResponseModal(false)
    
    if (!promptInstance) return
    
    const searchParams = new URLSearchParams({
      type,
      promptTitle: promptInstance.prompt?.title || '',
      prompt_id: promptInstance.id,
      prompt_text: promptInstance.prompt?.body || ''
    })
    
    navigate(`/stories/new?${searchParams.toString()}`)
  }
  if (!promptInstance?.prompt) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center mb-4">
            No prompts available right now
          </p>
          <Button onClick={onBrowseAll} variant="outline">
            Browse All Prompts
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl text-muted-foreground">Today's prompt</h2>
        
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-medium text-foreground flex-1">
            {promptInstance.prompt.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="gap-2">
              <Volume2 className="h-4 w-4" />
              Hear it
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Shuffle className="h-4 w-4" />
              Shuffle
            </Button>
          </div>
        </div>
        
        <p className="text-muted-foreground">
          No need to be perfect—just talk.
        </p>
      </div>

      {/* Prompt Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">
                Personal Prompt
              </p>
              <p className="text-foreground">
                {promptInstance.prompt.body}
              </p>
              
              {/* Person chips for person-specific prompts */}
              {promptInstance.person_ids && promptInstance.person_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {promptInstance.person_ids.map(personId => {
                    const person = people.find(p => p.id === personId)
                    return person ? (
                      <PersonChip key={personId} name={person.full_name} />
                    ) : null
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main CTA */}
      <Button 
        onClick={() => setShowResponseModal(true)}
        className="w-full h-14 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        <Mic className="h-5 w-5 mr-2" />
        Respond to this prompt
      </Button>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-2">
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">🏷️</span>
              </div>
            </div>
          </div>
          <h3 className="font-medium">Build Your Life Page</h3>
          <p className="text-sm text-muted-foreground">
            Collect stories, photos, and memories in one place
          </p>
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-2">
              <div className="flex items-center">
                <Mic className="h-6 w-6 text-muted-foreground mr-1" />
                <PenTool className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <h3 className="font-medium">Try Quick Voice</h3>
          <p className="text-sm text-muted-foreground">
            Just start talking
          </p>
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-2">
              <div className="flex items-center">
                <span className="text-amber-500 text-xl mr-1">⚡</span>
                <span className="text-muted-foreground">🏷️</span>
              </div>
            </div>
          </div>
          <h3 className="font-medium">Create Your Own Story</h3>
          <p className="text-sm text-muted-foreground">
            Share anything you like
          </p>
        </div>
      </div>

      {/* Browse All Prompts */}
      <div className="text-center">
        <Button 
          onClick={onBrowseAll}
          variant="outline"
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Browse all prompts
        </Button>
      </div>

      {/* Encouragement */}
      <div className="text-center flex items-center justify-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Just hit record and be yourself.
        </p>
      </div>

      {/* Response Modal */}
      {promptInstance?.prompt && (
        <ResponseModal
          isOpen={showResponseModal}
          onClose={() => setShowResponseModal(false)}
          prompt={{
            title: promptInstance.prompt.title,
            body: promptInstance.prompt.body
          }}
          onSelectResponse={handleResponseSelect}
        />
      )}
    </div>
  )
}