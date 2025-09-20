import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Share2, Users, Clock, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CreateFamilyCodeModal } from './CreateFamilyCodeModal'

interface Family {
  id: string
  name: string
  status: string
  verified_at: string | null
  created_at: string
}

interface ProvisionalFamilyBannerProps {
  familyId: string
  onDismiss?: () => void
}

export function ProvisionalFamilyBanner({ familyId, onDismiss }: ProvisionalFamilyBannerProps) {
  const [family, setFamily] = useState<Family | null>(null)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [daysSinceCreated, setDaysSinceCreated] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    loadFamilyData()
  }, [familyId])

  const loadFamilyData = async () => {
    try {
      const { data: familyData, error } = await supabase
        .from('families')
        .select('id, name, status, verified_at, created_at')
        .eq('id', familyId)
        .eq('status', 'provisional')
        .single()

      if (error || !familyData) {
        return // Family doesn't exist or is already verified
      }

      setFamily(familyData)
      
      const createdDate = new Date(familyData.created_at)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - createdDate.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      setDaysSinceCreated(diffDays)
    } catch (error) {
      console.error('Error loading family data:', error)
    }
  }

  const handleVerifyNow = async () => {
    try {
      const { error } = await supabase.functions.invoke('families-verify')

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Family verified!",
        description: "Your family space is now fully active.",
      })

      // Refresh the data or dismiss the banner
      loadFamilyData()
      onDismiss?.()
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Could not verify family at this time.",
        variant: "destructive"
      })
    }
  }

  // Don't show banner if family is already verified or doesn't exist
  if (!family || family.status !== 'provisional') {
    return null
  }

  const daysRemaining = Math.max(0, 7 - daysSinceCreated)

  return (
    <>
      <Alert className="mb-4 border-warning bg-warning/5">
        <Clock className="h-4 w-4" />
        <div className="flex-1">
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <strong>Share your invite now to avoid duplicates!</strong>
              <br />
              <span className="text-sm text-muted-foreground">
                Your family "{family.name}" will be automatically verified in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} 
                or when a second person joins.
              </span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCodeModal(true)}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button
                size="sm"
                onClick={handleVerifyNow}
              >
                <Users className="w-4 h-4 mr-1" />
                Verify Now
              </Button>
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </Alert>

      <CreateFamilyCodeModal 
        open={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        familyId={familyId}
        familyName={family.name}
      />
    </>
  )
}