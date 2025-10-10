import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'
import { usePrompts, type PromptInstance } from '@/hooks/usePrompts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ListenButton } from '@/components/prompts/ListenButton'
import { CheckCircle, Sparkles } from 'lucide-react'
import MediaUploader from '@/components/MediaUploader'

export default function PromptsSimple() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { toast } = useToast()
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [showComposer, setShowComposer] = useState(false)
  const [answerText, setAnswerText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  const { instances, createResponse, loading } = usePrompts(familyId || '')

  // Get family ID on mount
  useEffect(() => {
    const getFamilyId = async () => {
      if (!session?.user?.id) return
      
      const { data } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', session.user.id)
        .single()
      
      if (data) setFamilyId(data.family_id)
    }
    
    getFamilyId()
  }, [session])

  // Get unanswered prompts only
  const unansweredPrompts = useMemo(() => {
    return instances.filter(i => i.status === 'open')
  }, [instances])

  const currentPrompt = unansweredPrompts[currentPromptIndex]
  const allCaughtUp = !loading && unansweredPrompts.length === 0

  const handleShowAnother = () => {
    if (currentPromptIndex < unansweredPrompts.length - 1) {
      setCurrentPromptIndex(prev => prev + 1)
    } else {
      // Loop back to first
      setCurrentPromptIndex(0)
    }
    setShowComposer(false)
    setAnswerText('')
    setUploadedFiles([])
  }

  const handleAnswerThis = () => {
    setShowComposer(true)
  }

  const handleSaveAnswer = async () => {
    if (!currentPrompt || !answerText.trim()) return
    
    setSaving(true)
    
    try {
      // Upload media files if any
      if (uploadedFiles.length > 0 && session?.user?.id) {
        for (const file of uploadedFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${session.user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          // Save media record
          await supabase
            .from('media')
            .insert({
              prompt_instance_id: currentPrompt.id,
              profile_id: session.user.id,
              family_id: familyId,
              file_path: filePath,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
            })
        }
      }

      // Create the response
      await createResponse(currentPrompt.id, 'text', {
        text_body: answerText.trim()
      })

      toast({
        title: "👏 Memory saved",
        description: "Your answer has been added to the family archive."
      })

      // Reset and show next prompt
      setAnswerText('')
      setUploadedFiles([])
      setShowComposer(false)
      
      // Move to next prompt
      if (currentPromptIndex < unansweredPrompts.length - 1) {
        setCurrentPromptIndex(prev => prev + 1)
      } else {
        setCurrentPromptIndex(0)
      }
    } catch (error) {
      console.error('Error saving answer:', error)
      toast({
        title: "Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto text-center py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (allCaughtUp) {
    return (
      <div className="min-h-screen bg-background p-6" data-mode="simple">
        <div className="max-w-3xl mx-auto text-center py-12">
          <Card className="border-2" data-testid="all-caught-up">
            <CardContent className="pt-12 pb-12 space-y-6">
              <CheckCircle className="w-16 h-16 mx-auto text-success" />
              <h1 className="text-3xl font-bold">All caught up!</h1>
              <p className="text-xl text-muted-foreground">
                You've answered all available prompts. Check back later for more.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/home')}
                className="text-xl py-6 px-8"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentPrompt) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-6" data-mode="simple">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Listen Feature */}
        <div className="flex justify-end" data-testid="listen-feature">
          <ListenButton
            text={`${currentPrompt.prompt?.title}. ${currentPrompt.prompt?.body}`}
            promptId={currentPrompt.id}
            size="lg"
            showLabel
            className="text-xl py-6 px-8 h-auto"
          />
        </div>

        {/* Prompt Card */}
        <Card className="border-2" data-testid="prompt-card">
          <CardContent className="pt-8 pb-8 space-y-8">
            {/* Category Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-lg font-medium capitalize">
                  {currentPrompt.prompt?.category}
                </span>
              </div>
            </div>

            {/* Prompt Text */}
            <h1 className="text-3xl font-bold text-center leading-relaxed">
              {currentPrompt.prompt?.title}
            </h1>

            {currentPrompt.prompt?.body && (
              <p className="text-xl text-muted-foreground text-center">
                {currentPrompt.prompt.body}
              </p>
            )}

            {/* Composer */}
            {showComposer && (
              <div className="space-y-6 pt-4">
                <Textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Share your thoughts and memories..."
                  className="min-h-[200px] text-lg p-6 resize-none"
                  autoFocus
                />
                
                <MediaUploader
                  onFilesSelected={setUploadedFiles}
                  maxFiles={5}
                />

                <div className="flex gap-4">
                  <Button
                    onClick={handleSaveAnswer}
                    disabled={!answerText.trim() || saving}
                    size="lg"
                    className="flex-1 text-xl py-6 h-auto"
                  >
                    {saving ? 'Saving...' : 'Save Answer'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowComposer(false)
                      setAnswerText('')
                      setUploadedFiles([])
                    }}
                    variant="outline"
                    size="lg"
                    className="text-xl py-6 px-8 h-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!showComposer && (
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleAnswerThis}
                  size="lg"
                  className="flex-1 text-xl py-6 h-auto"
                  data-testid="prompt-answer-button"
                >
                  Answer This
                </Button>
                <Button
                  onClick={handleShowAnother}
                  variant="outline"
                  size="lg"
                  className="text-xl py-6 px-8 h-auto"
                  data-testid="prompt-show-another"
                >
                  Show Another
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="text-center text-muted-foreground">
          <p className="text-lg">
            Prompt {currentPromptIndex + 1} of {unansweredPrompts.length}
          </p>
        </div>
      </div>
    </div>
  )
}
