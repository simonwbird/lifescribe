import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import StoryCard from '@/components/StoryCard'
import AnswerCard from '@/components/AnswerCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
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
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Family Feed</h1>
              <div className="flex space-x-2">
                <Button asChild>
                  <Link to="/stories/new">Share Story</Link>
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
                    <Link to="/stories/new">Share Your First Story</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/prompts">Answer a Question</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
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
        </div>
      </div>
    </AuthGate>
  )
}