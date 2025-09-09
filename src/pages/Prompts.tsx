import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import MediaUploader from '@/components/MediaUploader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Shuffle, Sparkles, Grid3x3, ArrowLeft } from 'lucide-react'
import type { Question } from '@/lib/types'

export default function Prompts() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [shownQuestionIds, setShownQuestionIds] = useState<Set<string>>(new Set())
  const [showingEditor, setShowingEditor] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const initializePrompts = async () => {
      try {
        // Get user's family
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: member } = await supabase
            .from('members')
            .select('family_id')
            .eq('profile_id', user.id)
            .single()
          
          if (member) {
            setFamilyId(member.family_id)
            
            // Check if specific question was requested
            const questionId = searchParams.get('question_id')
            if (questionId) {
              await loadSpecificQuestion(questionId, member.family_id, user.id)
            } else {
              await loadRandomQuestion(member.family_id, user.id)
            }
          }
        }
      } catch (error) {
        console.error('Error initializing prompts:', error)
      }
    }

    initializePrompts()
  }, [searchParams])

  const loadSpecificQuestion = async (questionId: string, familyId: string, userId: string) => {
    const { data: question } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .eq('is_active', true)
      .single()
    
    if (question) {
      setCurrentQuestion(question)
      setShownQuestionIds(prev => new Set(prev).add(question.id))
    }
  }

  const loadRandomQuestion = async (familyId: string, userId: string) => {
    try {
      // Get questions user hasn't answered yet
      const { data: answeredQuestions } = await supabase
        .from('answers')
        .select('question_id')
        .eq('profile_id', userId)
        .eq('family_id', familyId)

      const answeredIds = answeredQuestions?.map(a => a.question_id) || []
      
      // Get random unanswered question, excluding recently shown ones
      const excludedIds = [...answeredIds, ...Array.from(shownQuestionIds)]
      
      let query = supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)

      if (excludedIds.length > 0) {
        query = query.not('id', 'in', `(${excludedIds.join(',')})`)
      }

      const { data: questions } = await query

      if (questions && questions.length > 0) {
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
        setCurrentQuestion(randomQuestion)
        setShownQuestionIds(prev => new Set(prev).add(randomQuestion.id))
      } else if (answeredIds.length === 0) {
        // Fallback to any active question if no exclusions work
        const { data: fallbackQuestions } = await supabase
          .from('questions')
          .select('*')
          .eq('is_active', true)
          .limit(1)
        
        if (fallbackQuestions && fallbackQuestions.length > 0) {
          setCurrentQuestion(fallbackQuestions[0])
          setShownQuestionIds(prev => new Set(prev).add(fallbackQuestions[0].id))
        }
      }
    } catch (error) {
      console.error('Error loading random question:', error)
    }
  }

  const handleShowAnother = async () => {
    if (!familyId) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await loadRandomQuestion(familyId, user.id)
      setShowingEditor(false)
      setAnswer('')
      setUploadedFiles([])
    }
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentQuestion || !answer.trim() || !familyId) return

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create answer
      const { data: answerData, error: answerError } = await supabase
        .from('answers')
        .insert({
          question_id: currentQuestion.id,
          profile_id: user.id,
          family_id: familyId,
          answer_text: answer.trim(),
        })
        .select()
        .single()

      if (answerError) throw answerError

      // Upload media files if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          // Save media record
          await supabase
            .from('media')
            .insert({
              answer_id: answerData.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: filePath,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
            })
        }
      }

      // Show success toast
      toast({
        title: "👏 Memory saved!",
        description: "Your story has been added to the family archive."
      })

      // Reset form
      setAnswer('')
      setUploadedFiles([])
      setShowingEditor(false)

    } catch (error) {
      console.error('Error creating answer:', error)
      toast({
        title: "Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!currentQuestion) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>No Questions Available</CardTitle>
                  <CardDescription>
                    Questions will appear here once they're added to the system.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center mb-4">
                  <Badge variant="secondary" className="capitalize px-4 py-2 text-sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {currentQuestion.category}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold leading-relaxed text-center">
                  {currentQuestion.question_text}
                </CardTitle>
                <CardDescription className="text-center">
                  Share your thoughts and memories with your family
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {!showingEditor ? (
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setShowingEditor(true)} 
                      className="w-full py-6 text-lg font-medium"
                      size="lg"
                    >
                      Answer This Question
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        onClick={handleShowAnother}
                        className="py-3"
                      >
                        <Shuffle className="w-4 h-4 mr-2" />
                        Show Another
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/prompts/browse')}
                        className="py-3"
                      >
                        <Grid3x3 className="w-4 h-4 mr-2" />
                        Browse Categories
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAnswer} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="answer" className="text-base font-medium">Your Answer</Label>
                      <Textarea
                        id="answer"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Share your thoughts and memories..."
                        rows={8}
                        required
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">Add Photos, Videos, or Audio (optional)</Label>
                      <MediaUploader
                        onFilesSelected={setUploadedFiles}
                        maxFiles={5}
                      />
                    </div>

                    <div className="flex space-x-4">
                      <Button 
                        type="submit" 
                        disabled={loading || !answer.trim()}
                        className="flex-1 py-3"
                        size="lg"
                      >
                        {loading ? 'Publishing...' : 'Publish Memory'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowingEditor(false)}
                        className="py-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {showingEditor && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleShowAnother}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Shuffle className="w-4 h-4 mr-1" />
                        Different Question
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate('/feed')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Feed
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!showingEditor && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  💡 Answer prompts regularly to build your family's story archive
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  )
}