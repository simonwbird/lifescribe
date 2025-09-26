import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle } from 'lucide-react'
import Header from '@/components/Header'
import PersonPromptsTab from '@/components/prompts/PersonPromptsTab'
import { Person, getUserRole, getPageType } from '@/utils/personUtils'

interface ProfileData {
  id: string
  email: string
  full_name: string
  avatar_url: string
  settings: any
}

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>()
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [memberRole, setMemberRole] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchPersonAndUser = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)

        if (!user) {
          window.location.href = '/login'
          return
        }

        const { data: personData, error: personError } = await supabase
          .from('people')
          .select('*')
          .eq('id', id)
          .single()

        if (personError) throw personError

        if (personData) {
          const { data: memberData } = await supabase
            .from('members')
            .select('role')
            .eq('family_id', personData.family_id)
            .eq('profile_id', user.id)
            .single()

          setMemberRole(memberData?.role || 'guest')
        }

        setPerson(personData as Person)
      } catch (error) {
        console.error('Error fetching person:', error)
        setError('Failed to load person data')
      } finally {
        setLoading(false)
      }
    }

    fetchPersonAndUser()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Person not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const userRole = getUserRole(person, currentUserId, memberRole)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{person.full_name}</h1>
        </div>

        <Tabs defaultValue="prompts" className="w-full">
          <TabsList>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
          </TabsList>
          <TabsContent value="prompts">
            <PersonPromptsTab
              person={person}
              familyId={person.family_id}
              onStartPrompt={(instanceId) => {
                window.location.href = `/prompts/respond/${instanceId}`
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}