import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Lightbulb, ChevronDown, Wand2, Users, Hash, Mic, QrCode } from 'lucide-react'
import { type StoryFormData, type AIAssist } from './StoryWizardTypes'

interface StoryWizardSidebarProps {
  formData: StoryFormData
  onTitleSuggestion: (title: string) => void
  onTagSuggestions: (tags: string[]) => void
  onPeopleSuggestions: (people: string[]) => void
  onVoiceToText: () => void
  onPhoneImport: () => void
  aiAssist: AIAssist
  className?: string
}

export default function StoryWizardSidebar({
  formData,
  onTitleSuggestion,
  onTagSuggestions,
  onPeopleSuggestions,
  onVoiceToText,
  onPhoneImport,
  aiAssist,
  className = ''
}: StoryWizardSidebarProps) {
  const [helpExpanded, setHelpExpanded] = useState(false)

  const promptIdeas = [
    "Where were you? Who was there?",
    "What could you hear, smell, or feel?",
    "What changed because of this moment?",
    "What would you want future generations to know?",
    "What made this person or place special?",
    "What traditions or values were passed down?"
  ]

  const exampleStory = `"Every Sunday after church, Gran would gather us kids in her kitchen. The smell of fresh bread and the sound of her humming while she kneaded dough for the week ahead. She'd tell us stories about our great-grandfather while we helped roll out biscuits, each tale more magical than the last."`

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mobile Collapsible Help */}
      <div className="lg:hidden">
        <Collapsible open={helpExpanded} onOpenChange={setHelpExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Need inspiration?
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${helpExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <SidebarContent
              promptIdeas={promptIdeas}
              exampleStory={exampleStory}
              formData={formData}
              onTitleSuggestion={onTitleSuggestion}
              onTagSuggestions={onTagSuggestions}
              onPeopleSuggestions={onPeopleSuggestions}
              onVoiceToText={onVoiceToText}
              onPhoneImport={onPhoneImport}
              aiAssist={aiAssist}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SidebarContent
          promptIdeas={promptIdeas}
          exampleStory={exampleStory}
          formData={formData}
          onTitleSuggestion={onTitleSuggestion}
          onTagSuggestions={onTagSuggestions}
          onPeopleSuggestions={onPeopleSuggestions}
          onVoiceToText={onVoiceToText}
          onPhoneImport={onPhoneImport}
          aiAssist={aiAssist}
        />
      </div>
    </div>
  )
}

interface SidebarContentProps {
  promptIdeas: string[]
  exampleStory: string
  formData: StoryFormData
  onTitleSuggestion: (title: string) => void
  onTagSuggestions: (tags: string[]) => void
  onPeopleSuggestions: (people: string[]) => void
  onVoiceToText: () => void
  onPhoneImport: () => void
  aiAssist: AIAssist
}

function SidebarContent({
  promptIdeas,
  exampleStory,
  formData,
  onTitleSuggestion,
  onTagSuggestions,
  onPeopleSuggestions,
  onVoiceToText,
  onPhoneImport,
  aiAssist
}: SidebarContentProps) {
  return (
    <div className="space-y-4">
      {/* Inspiration Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-brand-green" />
            Need inspiration?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Questions to consider:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {promptIdeas.map((idea, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0" />
                  {idea}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">What good looks like:</h4>
            <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-lg">
              {exampleStory}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Assists */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-brand-green" />
            AI Assists
          </CardTitle>
          <CardDescription>
            Let AI help you craft your story
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={() => {
              // Mock title suggestions based on content
              const suggestions = formData.content ? 
                [`"${formData.content.split(' ').slice(0, 4).join(' ')}..."`, 
                 'A Family Memory', 
                 'Sunday Stories'] :
                ['A Family Memory', 'Sunday Stories', 'Growing Up Together']
              onTitleSuggestion(suggestions[0])
            }}
            disabled={!formData.content.trim()}
          >
            <Wand2 className="h-4 w-4" />
            Get title suggestions
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={() => {
              // Mock suggestions based on content
              const mockTags = ['family', 'childhood', 'tradition', 'memory']
              const mockPeople = ['grandmother', 'siblings']
              onTagSuggestions(mockTags)
              onPeopleSuggestions(mockPeople)
            }}
            disabled={!formData.content.trim()}
          >
            <Hash className="h-4 w-4" />
            Suggest tags & people
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={onVoiceToText}
          >
            <Mic className="h-4 w-4" />
            Voice to text
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={onPhoneImport}
          >
            <QrCode className="h-4 w-4" />
            Import from phone
          </Button>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Writing Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Clear, specific titles work best (e.g., "Gran's First Day at the Mill, 1952")</p>
            <p>• Include sensory details - what you saw, heard, smelled</p>
            <p>• End with why this memory matters to your family</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}