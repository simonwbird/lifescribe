import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Type, Mic, Video, Headphones } from 'lucide-react'
import { useState, useEffect } from 'react'
import { type StoryFormData } from '../StoryWizardTypes'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'

interface StoryWizardStep0Props {
  formData: StoryFormData
  onChange: (updates: Partial<StoryFormData>) => void
  onNext: () => void
  currentPrompt?: { title: string; description: string }
}

export default function StoryWizardStep0({ 
  formData, 
  onChange, 
  onNext, 
  currentPrompt 
}: StoryWizardStep0Props) {
  const [selectedType, setSelectedType] = useState<'text' | 'audio' | 'video' | null>(null)
  const { speak, isSpeaking, stop } = useTextToSpeech()
  const [canHearIt, setCanHearIt] = useState(false)

  useEffect(() => {
    // Check if we have family audio stories or can use TTS
    setCanHearIt(true) // For now, always enable since we can use TTS
  }, [])

  const handleSelectType = (type: 'text' | 'audio' | 'video') => {
    setSelectedType(type)
    onChange({ inputType: type })
  }

  const handleContinue = () => {
    if (selectedType === 'audio') {
      // Navigate to audio recording step
      window.location.href = '/new-story?type=audio'
    } else if (selectedType === 'video') {
      // Navigate to video recording step  
      window.location.href = '/new-story?type=video'
    } else {
      // Navigate to text entry (normal flow)
      window.location.href = '/new-story?type=text'
    }
  }

  const handleHearIt = () => {
    if (isSpeaking) {
      stop()
      return
    }

    const textToSpeak = currentPrompt 
      ? `Today's memory prompt: ${currentPrompt.title}. ${currentPrompt.description}`
      : "Welcome to your family story collection. Choose how you'd like to share your memory today."
    
    speak(textToSpeak)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">
          How would you like to share your story?
        </h1>
        <p className="text-muted-foreground">
          Choose the way that feels most comfortable for you
        </p>
        
        {currentPrompt && (
          <Card className="bg-muted/50 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-primary">Today's Prompt</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleHearIt}
                  className="gap-2 text-primary hover:text-primary/80"
                  disabled={!canHearIt}
                >
                  <Headphones className="h-4 w-4" />
                  {isSpeaking ? 'Stop' : 'Hear It'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <h4 className="font-medium mb-2">{currentPrompt.title}</h4>
              <p className="text-sm text-muted-foreground">{currentPrompt.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
            selectedType === 'text' 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleSelectType('text')}
        >
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Type className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Write</h3>
              <p className="text-sm text-muted-foreground">
                Type your story at your own pace
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Perfect for detailed stories
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
            selectedType === 'audio' 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleSelectType('audio')}
        >
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Record Audio</h3>
              <p className="text-sm text-muted-foreground">
                Speak your story naturally
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Great for personal memories
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
            selectedType === 'video' 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleSelectType('video')}
        >
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Record Video</h3>
              <p className="text-sm text-muted-foreground">
                Show and tell your story
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Capture full moments
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedType && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleContinue}
            size="lg" 
            className="px-8"
          >
            Continue with {selectedType === 'text' ? 'Writing' : selectedType === 'audio' ? 'Audio' : 'Video'}
          </Button>
        </div>
      )}
    </div>
  )
}