import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import type { Question } from '@/lib/types'

const CATEGORY_ICONS: Record<string, string> = {
  childhood: '🧸',
  family: '👨‍👩‍👧‍👦',
  teenage: '🎵',
  adulthood: '💼',
  travel: '🌍',
  love: '💕',
  food: '🍽️',
  work: '⚒️',
  life_lessons: '💡',
  funny: '😄'
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  childhood: 'Early memories and growing up',
  family: 'Family traditions and relationships', 
  teenage: 'Teenage years and coming of age',
  adulthood: 'Adult milestones and experiences',
  travel: 'Adventures and places visited',
  love: 'Relationships and romance',
  food: 'Favorite meals and cooking memories',
  work: 'Career experiences and jobs',
  life_lessons: 'Wisdom and life advice',
  funny: 'Humorous stories and moments'
}

export default function PromptsBrowse() {
  const [questionsByCategory, setQuestionsByCategory] = useState<Record<string, Question[]>>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user's family and answered questions
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: member } = await supabase
            .from('members')
            .select('family_id')
            .eq('profile_id', user.id)
            .single()
          
          if (member) {
            setFamilyId(member.family_id)
            
            // Get answered questions for this user/family
            const { data: answers } = await supabase
              .from('answers')
              .select('question_id')
              .eq('profile_id', user.id)
              .eq('family_id', member.family_id)
            
            setAnsweredQuestionIds(new Set(answers?.map(a => a.question_id) || []))
          }
        }

        // Get all active questions grouped by category
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .eq('is_active', true)
          .order('question_text')

        if (questions) {
          const grouped = questions.reduce((acc, question) => {
            if (!acc[question.category]) {
              acc[question.category] = []
            }
            acc[question.category].push(question)
            return acc
          }, {} as Record<string, Question[]>)
          
          setQuestionsByCategory(grouped)
        }
      } catch (error) {
        console.error('Error loading browse data:', error)
      }
    }

    loadData()
  }, [])

  const handleAnswerQuestion = (questionId: string) => {
    navigate(`/prompts?question_id=${questionId}`)
  }

  const categories = Object.keys(questionsByCategory).sort()

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/prompts')}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Prompts
              </Button>
              <h1 className="text-3xl font-bold mb-2">Browse by Category</h1>
              <p className="text-muted-foreground">
                Explore questions organized by theme and topic
              </p>
            </div>

            {!selectedCategory ? (
              /* Category Grid */
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => {
                  const questions = questionsByCategory[category] || []
                  const answered = questions.filter(q => answeredQuestionIds.has(q.id)).length
                  const total = questions.length
                  
                  return (
                    <Card 
                      key={category}
                      className="cursor-pointer hover:shadow-lg transition-all border-0 shadow-md"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <CardHeader className="text-center pb-4">
                        <div className="text-4xl mb-2">
                          {CATEGORY_ICONS[category] || '📝'}
                        </div>
                        <CardTitle className="capitalize text-xl">
                          {category.replace('_', ' ')}
                        </CardTitle>
                        <CardDescription>
                          {CATEGORY_DESCRIPTIONS[category] || 'Questions about this topic'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center pt-0">
                        <div className="mb-4">
                          <Badge variant="secondary" className="text-sm">
                            {answered}/{total} answered
                          </Badge>
                        </div>
                        <Button variant="outline" className="w-full">
                          View {total} Questions
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              /* Question List for Selected Category */
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      All Categories
                    </Button>
                    <div className="text-3xl">{CATEGORY_ICONS[selectedCategory] || '📝'}</div>
                    <div>
                      <h2 className="text-2xl font-bold capitalize">
                        {selectedCategory.replace('_', ' ')}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {CATEGORY_DESCRIPTIONS[selectedCategory]}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {(questionsByCategory[selectedCategory] || []).slice(0, 10).map(question => {
                    const isAnswered = answeredQuestionIds.has(question.id)
                    
                    return (
                      <Card key={question.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg leading-relaxed flex-1 pr-4">
                              {question.question_text}
                            </CardTitle>
                            {isAnswered && (
                              <Badge variant="default" className="shrink-0">
                                ✓ Answered
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => handleAnswerQuestion(question.id)}
                            variant={isAnswered ? "outline" : "default"}
                            className="w-full"
                          >
                            {isAnswered ? 'Answer Again' : 'Answer This'}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {(questionsByCategory[selectedCategory]?.length || 0) > 10 && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Showing first 10 questions. More available when you answer these!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  )
}