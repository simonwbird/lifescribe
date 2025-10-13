import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { StoryCreationDashboard } from '@/components/analytics/StoryCreationDashboard'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export default function StoryAnalytics() {
  const navigate = useNavigate()
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [families, setFamilies] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFamilies() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }

        const { data: memberData } = await supabase
          .from('members')
          .select('family_id, families(id, name)')
          .eq('profile_id', user.id)

        if (memberData && memberData.length > 0) {
          const familyList = memberData
            .map(m => m.families)
            .filter(f => f !== null) as Array<{ id: string; name: string }>

          setFamilies(familyList)
          
          // Auto-select first family
          if (familyList.length > 0) {
            setFamilyId(familyList[0].id)
          }
        }
      } catch (error) {
        console.error('Error loading families:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFamilies()
  }, [navigate])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Story Analytics</h1>
          <p className="text-muted-foreground">Track how stories are created and what prompts work best</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : families.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Families Found</CardTitle>
              <CardDescription>You need to be a member of a family to view analytics</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Select Family</label>
              <Select value={familyId || undefined} onValueChange={setFamilyId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a family" />
                </SelectTrigger>
                <SelectContent>
                  {families.map(family => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {familyId && <StoryCreationDashboard familyId={familyId} />}
          </>
        )}
      </div>
    </div>
  )
}
