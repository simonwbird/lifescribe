import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Lightbulb } from 'lucide-react'
import { type StoryFormData } from '../StoryWizardTypes'

interface StoryWizardStep1Props {
  formData: StoryFormData
  onChange: (updates: Partial<StoryFormData>) => void
  onNext: () => void
  onPrevious?: () => void
  isPhotoFirst?: boolean
  isVoiceFirst?: boolean
}

export default function StoryWizardStep1({ 
  formData, 
  onChange, 
  onNext,
  onPrevious,
  isPhotoFirst = false,
  isVoiceFirst = false
}: StoryWizardStep1Props) {
  const isValid = formData.title.trim().length > 0 && formData.content.trim().length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold mb-2">Share your story</h2>
        <p className="text-muted-foreground">
          Capture a memory and link it to people, places, and photos.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Title
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g., Gran's first day at the mill, 1952"
            className="text-base"
            aria-describedby="title-help"
          />
          <p id="title-help" className="text-xs text-muted-foreground">
            Clear, specific titles work best and help family members find your story later.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-sm font-medium">
            Story
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Tell your story... Where were you? Who was there? What made this moment special?"
            rows={12}
            className="resize-none text-base leading-relaxed"
            aria-describedby="content-help"
          />
          <p id="content-help" className="text-xs text-muted-foreground">
            Include details about what you saw, heard, or felt. What would you want future generations to know?
          </p>
        </div>

        {/* Quick Tips */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-brand-green mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm mb-1">Writing tip</h4>
              <p className="text-sm text-muted-foreground">
                Start with the scene - where you were and who was there. Then describe what happened and why it mattered to your family.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex ${isPhotoFirst || isVoiceFirst ? 'justify-between' : 'justify-end'} pt-4`}>
        {(isPhotoFirst || isVoiceFirst) && onPrevious && (
          <Button variant="outline" onClick={onPrevious}>
            {isPhotoFirst ? 'Back to Photos & Video' : 'Back to Voice Recording'}
          </Button>
        )}
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground"
        >
          Continue to People & Places
        </Button>
      </div>
    </div>
  )
}