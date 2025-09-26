import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '@/components/Header'
import MediaUploader from '@/components/MediaUploader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Shuffle, Sparkles, Grid3x3, ArrowLeft, Zap, Save, AlertCircle } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import QuickCaptureComposer, { type QuickCapturePrompt } from '@/components/capture/QuickCaptureComposer'
import type { Question } from '@/lib/types'

interface AutosaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  message: string
}

interface DraftData {
  questionId: string
  answer: string
  uploadedFiles: File[]
  timestamp: number
}

export default function Prompts() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [shownQuestionIds, setShownQuestionIds] = useState<Set<string>>(new Set())
  const [showingEditor, setShowingEditor] = useState(false)
  const [showQuickCapture, setShowQuickCapture] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>({
    status: 'idle',
    message: ''
  })
  const [hasDraft, setHasDraft] = useState(false)
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { track } = useAnalytics()
  const autosaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const formDataRef = useRef({ answer: '', uploadedFiles: [] as File[] })

  // Autosave functionality
  const getDraftKey = (questionId: string) => `prompt_draft_${questionId}`
  
  const saveDraftToLocalStorage = useCallback((questionId: string, draftData: Omit<DraftData, 'timestamp'>) => {
    try {
      const draft: DraftData = {
        ...draftData,
        timestamp: Date.now()
      }
      localStorage.setItem(getDraftKey(questionId), JSON.stringify(draft))
      setAutosaveStatus({
        status: 'saved',
        lastSaved: new Date(),
        message: 'Draft saved'
      })
    } catch (error) {
      console.error('Failed to save draft:', error)
      setAutosaveStatus({
        status: 'error',
        message: 'Failed to save draft'
      })
    }
  }, [])

  const loadDraftFromLocalStorage = useCallback((questionId: string): DraftData | null => {
    try {
      const saved = localStorage.getItem(getDraftKey(questionId))
      if (saved) {
        const draft = JSON.parse(saved) as DraftData
        // Only load drafts from the last 24 hours
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          return draft
        } else {
          localStorage.removeItem(getDraftKey(questionId))
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
    return null
  }, [])

  const clearDraft = useCallback((questionId: string) => {
    localStorage.removeItem(getDraftKey(questionId))
    setHasDraft(false)
  }, [])

  // Auto-save effect
  useEffect(() => {
    if (!currentQuestion || !showingEditor) return

    const saveCurrentDraft = () => {
      if (formDataRef.current.answer.trim() || formDataRef.current.uploadedFiles.length > 0) {
        setAutosaveStatus({ status: 'saving', message: 'Saving draft...' })
        saveDraftToLocalStorage(currentQuestion.id, {
          questionId: currentQuestion.id,
          answer: formDataRef.current.answer,
          uploadedFiles: formDataRef.current.uploadedFiles
        })
      }
    }

    // Start autosave interval
    autosaveIntervalRef.current = setInterval(saveCurrentDraft, 10000) // Save every 10 seconds

    return () => {
      if (autosaveIntervalRef.current) {
        clearInterval(autosaveIntervalRef.current)
      }
    }
  }, [currentQuestion, showingEditor, saveDraftToLocalStorage])

  // Update form data ref when state changes
  useEffect(() => {
    formDataRef.current = { answer, uploadedFiles }
  }, [answer, uploadedFiles])

  // Handle beforeunload event to show save draft confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showingEditor && (answer.trim() || uploadedFiles.length > 0)) {
        e.preventDefault()
        e.returnValue = '' // Required for Chrome
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [showingEditor, answer, uploadedFiles])

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
      
      // Check for existing draft
      const draft = loadDraftFromLocalStorage(question.id)
      if (draft) {
        setHasDraft(true)
      }
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
        
        // Check for existing draft
        const draft = loadDraftFromLocalStorage(randomQuestion.id)
        if (draft) {
          setHasDraft(true)
        }
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
          
          // Check for existing draft
          const draft = loadDraftFromLocalStorage(fallbackQuestions[0].id)
          if (draft) {
            setHasDraft(true)
          }
        }
      }
    } catch (error) {
      console.error('Error loading random question:', error)
    }
  }

  const handleShowAnother = async () => {
    if (!familyId) return
    
    // Check if there's unsaved content
    if (showingEditor && (answer.trim() || uploadedFiles.length > 0)) {
      setPendingAction(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await loadRandomQuestion(familyId, user.id)
          setShowingEditor(false)
          setAnswer('')
          setUploadedFiles([])
          setHasDraft(false)
          setAutosaveStatus({ status: 'idle', message: '' })
        }
      })
      setShowSaveDraftDialog(true)
      return
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await loadRandomQuestion(familyId, user.id)
      setShowingEditor(false)
      setAnswer('')
      setUploadedFiles([])
      setHasDraft(false)
      setAutosaveStatus({ status: 'idle', message: '' })
    }
  }

  const resumeDraft = () => {
    if (!currentQuestion) return
    
    const draft = loadDraftFromLocalStorage(currentQuestion.id)
    if (draft) {
      setAnswer(draft.answer)
      setUploadedFiles(draft.uploadedFiles)
      setShowingEditor(true)
      setHasDraft(false)
      
      toast({
        title: "Draft restored",
        description: "Your previous work has been restored."
      })
    }
  }

  const discardDraft = () => {
    if (!currentQuestion) return
    
    clearDraft(currentQuestion.id)
    setHasDraft(false)
    
    toast({
      title: "Draft discarded",
      description: "Starting fresh with this prompt."
    })
  }

  const handleSaveDraft = () => {
    if (!currentQuestion) return
    
    saveDraftToLocalStorage(currentQuestion.id, {
      questionId: currentQuestion.id,
      answer,
      uploadedFiles
    })
    
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
    setShowSaveDraftDialog(false)
  }

  const handleDiscardAndContinue = () => {
    if (!currentQuestion) return
    
    clearDraft(currentQuestion.id)
    
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
    setShowSaveDraftDialog(false)
  }

  const handleQuickCapture = () => {
    track('prompt_quick_capture_clicked')
    setShowQuickCapture(true)
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

      // Clear draft and reset form
      if (currentQuestion) {
        clearDraft(currentQuestion.id)
      }
      setAnswer('')
      setUploadedFiles([])
      setShowingEditor(false)
      setAutosaveStatus({ status: 'idle', message: '' })

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

  const currentPrompt: QuickCapturePrompt | undefined = currentQuestion ? {
    id: currentQuestion.id,
    category: currentQuestion.category || 'Memory',
    question: currentQuestion.question_text,
    subcopy: 'Share your thoughts and memories with your family'
  } : undefined

  if (!currentQuestion) {
    return (
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
    )
  }

  return (
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
                    {hasDraft && (
                      <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-warning" />
                          <span className="font-medium text-sm">Draft found</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You have an unfinished response to this question.
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            onClick={resumeDraft}
                            size="sm"
                            variant="outline"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Resume Draft
                          </Button>
                          <Button
                            onClick={discardDraft}
                            size="sm"
                            variant="ghost"
                          >
                            Start Fresh
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleQuickCapture}
                      className="w-full py-6 text-lg font-medium"
                      size="lg"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Answer with Quick Capture
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

                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        💡 Any capture counts toward your streak
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {autosaveStatus.status !== 'idle' && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded">
                        <span>{autosaveStatus.message}</span>
                        {autosaveStatus.lastSaved && (
                          <span>
                            Last saved: {autosaveStatus.lastSaved.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    )}
                    
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
                          onClick={() => {
                            if (answer.trim() || uploadedFiles.length > 0) {
                              setPendingAction(() => {
                                setShowingEditor(false)
                                setAnswer('')
                                setUploadedFiles([])
                                setAutosaveStatus({ status: 'idle', message: '' })
                              })
                              setShowSaveDraftDialog(true)
                            } else {
                              setShowingEditor(false)
                            }
                          }}
                          className="py-3"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
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
          </div>
        </div>

        {/* Quick Capture Composer */}
        <QuickCaptureComposer
          isOpen={showQuickCapture}
          onClose={() => setShowQuickCapture(false)}
          prompt={currentPrompt}
          onSave={() => {
            // Handle successful save
            handleShowAnother() // Load another question
          }}
        />

        {/* Save Draft Confirmation Dialog */}
        <AlertDialog open={showSaveDraftDialog} onOpenChange={setShowSaveDraftDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save your work?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Would you like to save them as a draft so you can continue later?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDiscardAndContinue}>
                Discard Changes
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveDraft}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
   )
 }