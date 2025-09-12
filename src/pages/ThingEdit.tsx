import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import ArtifactWizard from '@/components/objects/ArtifactWizard'
import CategoryChooser from '@/components/objects/CategoryChooser'

export default function ThingEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [categoryId, setCategoryId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadThingCategory()
    }
  }, [id])

  const loadThingCategory = async () => {
    try {
      const { data: thingData, error } = await supabase
        .from('things')
        .select('object_type')
        .eq('id', id)
        .single()

      if (error) throw error
      
      // Map object_type to category for the wizard
      setCategoryId(thingData.object_type || 'general')
    } catch (error) {
      console.error('Error loading thing:', error)
      toast({
        title: "Error",
        description: "Could not load item for editing",
        variant: "destructive"
      })
      navigate('/collections?tab=object')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    navigate('/collections?tab=object')
  }

  const handleCancel = () => {
    navigate('/collections?tab=object')
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center">Loading...</div>
          </div>
        </div>
      </AuthGate>
    )
  }

  if (!categoryId) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-lg mb-4">Item not found</p>
              <button onClick={() => navigate('/collections?tab=object')}>
                Back to Objects
              </button>
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
        <ArtifactWizard
          categoryId={categoryId}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </AuthGate>
  )
}