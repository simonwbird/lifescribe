import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TreePine } from 'lucide-react'
import FamilyExplorerWrapper from '@/components/familyTreeV2/FamilyExplorerWrapper'
import { supabase } from '@/integrations/supabase/client'

const FamilyTreeExplorer = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [familyId, setFamilyId] = useState<string | null>(null)
  const focusPersonId = searchParams.get('focus')

  useEffect(() => {
    loadUserFamily()
  }, [])

  const loadUserFamily = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (membership) {
        setFamilyId(membership.family_id)
      }
    } catch (error) {
      console.error('Error loading family:', error)
    }
  }

  if (!familyId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="h-screen flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <Button variant="ghost" size="sm" onClick={() => navigate('/family/tree')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tree
        </Button>
        <TreePine className="h-5 w-5" />
        <h1 className="text-lg font-semibold">Family Explorer</h1>
      </div>
      
      <div className="flex-1 fe-canvas">
        <FamilyExplorerWrapper 
          familyId={familyId}
          focusPersonId={focusPersonId}
          onPersonFocus={(personId) => navigate(`?focus=${personId}`)}
        />
      </div>
      </div>
    </>
  )
}

export default FamilyTreeExplorer