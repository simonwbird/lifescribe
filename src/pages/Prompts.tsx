import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import MediaUploader from '@/components/MediaUploader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import type { Question } from '@/lib/types'

export default function Prompts() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const getQuestionsAndFamily = async () => {
      try {
        // Get questions
        const { data: questionsData } = await supabase
          .from('questions')
          .select('*')
          .order('created_at')

        if (questionsData) {
          setQuestions(questionsData)
        }

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
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    getQuestionsAndFamily()
  }, [])

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuestion || !answer.trim() || !familyId) return

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create answer
      const { data: answerData, error: answerError } = await supabase
        .from('answers')
        .insert({
          question_id: selectedQuestion.id,
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

      navigate('/feed')
    } catch (error) {
      console.error('Error creating answer:', error)
    } finally {
      setLoading(false)
    }
  }

  const questionsByCategory = questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = []
    }
    acc[question.category].push(question)
    return acc
  }, {} as Record<string, Question[]>)

  if (selectedQuestion) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{selectedQuestion.category}</Badge>
                    <Button variant="ghost" onClick={() => setSelectedQuestion(null)}>
                      Choose Different Question
                    </Button>
                  </div>
                  <CardTitle className="text-xl">{selectedQuestion.question_text}</CardTitle>
                  <CardDescription>
                    Share your thoughts and memories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitAnswer} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="answer">Your Answer</Label>
                      <Textarea
                        id="answer"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={8}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Photos & Videos</Label>
                      <MediaUploader
                        onFilesSelected={setUploadedFiles}
                        maxFiles={5}
                      />
                    </div>

                    <div className="flex space-x-4">
                      <Button type="submit" disabled={loading || !answer.trim()}>
                        {loading ? 'Submitting...' : 'Submit Answer'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => navigate('/feed')}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">Memory Questions</h1>
              <p className="text-muted-foreground">
                Choose a question to answer and share your personal memories with your family
              </p>
            </div>

            <div className="space-y-8">
              {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
                <div key={category}>
                  <h2 className="text-xl font-semibold mb-4 capitalize">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryQuestions.map((question) => (
                      <Card 
                        key={question.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedQuestion(question)}
                      >
                        <CardHeader>
                          <Badge variant="outline" className="w-fit">{question.category}</Badge>
                          <CardTitle className="text-lg leading-relaxed">
                            {question.question_text}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button variant="outline" className="w-full">
                            Answer This Question
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {questions.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>No Questions Available</CardTitle>
                  <CardDescription>
                    Questions will appear here once they're added to the system.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  )
}