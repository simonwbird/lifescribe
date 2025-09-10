import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import StoryCard from '@/components/StoryCard'
import AnswerCard from '@/components/AnswerCard'
import ActivityFeed from '@/components/ActivityFeed'
import EngagementPrompts from '@/components/EngagementPrompts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, SkipForward } from 'lucide-react'
import type { Story, Answer, Profile, Question } from '@/lib/types'

type FeedItem = {
  type: 'story' | 'answer'
  data: (Story & { profiles: Profile }) | (Answer & { profiles: Profile; questions: Question })
  created_at: string
}

export default function Feed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [featuredQuestion, setFeaturedQuestion] = useState<Question | null>(null)

  const handleSkipQuestion = async () => {
    if (!featuredQuestion || !familyId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Store skipped question in localStorage
      const skippedKey = `skipped_questions_${user.id}_${familyId}`
      const skipped = JSON.parse(localStorage.getItem(skippedKey) || '[]')
      skipped.push(featuredQuestion.id)
      localStorage.setItem(skippedKey, JSON.stringify(skipped))

      // Find next available question
      const { data: answeredQuestions } = await supabase
        .from('answers')
        .select('question_id')
        .eq('profile_id', user.id)
        .eq('family_id', familyId)

      const answeredIds = answeredQuestions?.map(a => a.question_id) || []
      const excludedIds = [...answeredIds, ...skipped]
      
      let questionQuery = supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .limit(1)

      if (excludedIds.length > 0) {
        questionQuery = questionQuery.not('id', 'in', `(${excludedIds.join(',')})`)
      }

      const { data: questions } = await questionQuery
      setFeaturedQuestion(questions?.[0] || null)
    } catch (error) {
      console.error('Error skipping question:', error)
    }
  }

  useEffect(() => {
    const getFamilyAndFeed = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user's family
        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()

        if (!member) return
        setFamilyId(member.family_id)

        // Get a featured question for the prompt card
        const { data: answeredQuestions } = await supabase
          .from('answers')
          .select('question_id')
          .eq('profile_id', user.id)
          .eq('family_id', member.family_id)

        const answeredIds = answeredQuestions?.map(a => a.question_id) || []
        
        // Get skipped questions from localStorage
        const skippedKey = `skipped_questions_${user.id}_${member.family_id}`
        const skippedIds = JSON.parse(localStorage.getItem(skippedKey) || '[]')
        const excludedIds = [...answeredIds, ...skippedIds]
        
        let questionQuery = supabase
          .from('questions')
          .select('*')
          .eq('is_active', true)
          .limit(1)

        if (excludedIds.length > 0) {
          questionQuery = questionQuery.not('id', 'in', `(${excludedIds.join(',')})`)
        }

        const { data: questions } = await questionQuery
        if (questions && questions.length > 0) {
          setFeaturedQuestion(questions[0])
        } else {
          // Fallback to any question if all are answered
          const { data: fallbackQuestions } = await supabase
            .from('questions')
            .select('*')
            .eq('is_active', true)
            .limit(1)
          setFeaturedQuestion(fallbackQuestions?.[0] || null)
        }

        // Get stories
        const { data: stories } = await supabase
          .from('stories')
          .select(`
            *,
            profiles (*)
          `)
          .eq('family_id', member.family_id)
          .order('created_at', { ascending: false })
          .limit(10)

        // Get answers  
        const { data: answers } = await supabase
          .from('answers')
          .select(`
            *,
            profiles (*),
            questions (*)
          `)
          .eq('family_id', member.family_id)
          .order('created_at', { ascending: false })
          .limit(10)

        // Combine and sort by creation date
        const combined: FeedItem[] = [
          ...(stories || []).map(story => ({
            type: 'story' as const,
            data: story,
            created_at: story.created_at
          })),
          ...(answers || []).map(answer => ({
            type: 'answer' as const,
            data: answer,
            created_at: answer.created_at
          }))
        ]

        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setFeedItems(combined.slice(0, 20))
      } catch (error) {
        console.error('Error fetching feed:', error)
      } finally {
        setLoading(false)
      }
    }

    getFamilyAndFeed()
  }, [])

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen">
          <Header />
          <div className="container mx-auto px-4 py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Family Feed</h1>
                <div className="flex space-x-2">
                  <Button asChild>
                    <Link to="/new-story">Share Story</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/prompts">Answer Question</Link>
                  </Button>
                </div>
              </div>

              {feedItems.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome to your family feed!</CardTitle>
                    <CardDescription>
                      Start sharing memories by creating your first story or answering a question.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex space-x-4">
                    <Button asChild>
                      <Link to="/new-story">Share Your First Story</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/prompts">Answer a Question</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Featured Prompt Card */}
                  {featuredQuestion && (
                    <Card className="bg-gradient-to-br from-rose-50/80 to-amber-50/60 border-rose-200/50 shadow-lg">
                      <CardHeader>
                        <div className="flex items-center space-x-2 mb-2">
                          <Sparkles className="w-5 h-5 text-rose-500" />
                          <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200">
                            Daily Prompt
                          </Badge>
                        </div>
                        <CardTitle className="text-xl leading-relaxed">
                          {featuredQuestion.question_text}
                        </CardTitle>
                        <CardDescription>
                          Share your memories with your family • {featuredQuestion.category}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex space-x-3">
                          <Button asChild className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600">
                            <Link to="/prompts">
                              Answer This Prompt <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleSkipQuestion}
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            <SkipForward className="w-4 h-4 mr-2" />
                            Skip Question
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Feed Items */}
                  {feedItems.map((item, index) => (
                    <div key={`${item.type}-${item.data.id}-${index}`}>
                      {item.type === 'story' ? (
                        <StoryCard story={item.data as Story & { profiles: Profile }} />
                      ) : (
                        <AnswerCard answer={item.data as Answer & { profiles: Profile; questions: Question }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {familyId && <ActivityFeed familyId={familyId} showNotifications={true} />}
              <EngagementPrompts />
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}