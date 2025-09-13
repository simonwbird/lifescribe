import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TreePine } from 'lucide-react'
import { AncestorFan } from '@/components/familyTreeV2/AncestorFan'
import { supabase } from '@/integrations/supabase/client'

const FamilyTreeFan = () => {
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

  if (!familyId || !focusPersonId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <TreePine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Please select a person to view their ancestor fan</p>
          <Button className="mt-4" onClick={() => navigate('/family/tree')}>
            Back to Tree
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <Button variant="ghost" size="sm" onClick={() => navigate('/family/tree')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tree
        </Button>
        <TreePine className="h-5 w-5" />
        <h1 className="text-lg font-semibold">Ancestor Fan</h1>
      </div>
      
      <div className="flex-1">
        <AncestorFan 
          familyId={familyId}
          focusPersonId={focusPersonId}
          onPersonClick={(personId) => navigate(`/family-tree/explorer?focus=${personId}`)}
        />
      </div>
    </div>
  )
}

export default FamilyTreeFan