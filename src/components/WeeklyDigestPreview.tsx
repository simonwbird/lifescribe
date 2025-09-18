import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Users, Sparkles, Calendar, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'

interface WeeklyDigestPreviewProps {
  familyId: string
  className?: string
}

export default function WeeklyDigestPreview({ familyId, className }: WeeklyDigestPreviewProps) {
  const [memberCount, setMemberCount] = useState(0)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    checkMemberCount()
  }, [familyId])

  const checkMemberCount = async () => {
    try {
      const { data: members } = await supabase
        .from('members')
        .select('id')
        .eq('family_id', familyId)

      const count = members?.length || 0
      setMemberCount(count)
      setIsUnlocked(count >= 2)
    } catch (error) {
      console.error('Error checking member count:', error)
    }
  }

  const handleUnlock = () => {
    if (isUnlocked) {
      // Navigate to actual digest
      window.location.href = '/digest'
    } else {
      setShowUnlockModal(true)
    }
  }

  return (
    <>
      <Card className={`relative overflow-hidden ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Digest
              {!isUnlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            </CardTitle>
            <Badge variant={isUnlocked ? "default" : "secondary"}>
              {isUnlocked ? "Unlocked" : "Locked"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Blurred preview content */}
          <div className={`space-y-3 ${!isUnlocked ? 'filter blur-sm' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <p className="font-medium text-sm">This Week's Highlights</p>
                <p className="text-xs text-muted-foreground">3 new memories shared</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded animate-pulse" />
              <div className="h-2 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-2 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
            
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Family Activity</span>
              <span>View All →</span>
            </div>
          </div>
          
          {/* Unlock overlay */}
          {!isUnlocked && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
              <div className="text-center space-y-3 p-4">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium">Almost There!</p>
                  <p className="text-sm text-muted-foreground">
                    Invite {3 - memberCount} more family member{3 - memberCount !== 1 ? 's' : ''} to unlock
                  </p>
                </div>
                <Button size="sm" onClick={handleUnlock} variant="outline">
                  Get Members ({memberCount}/3)
                </Button>
              </div>
            </div>
          )}
          
          {isUnlocked && (
            <Button 
              onClick={handleUnlock}
              className="w-full"
              variant="outline"
            >
              View This Week's Digest
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Unlock celebration modal */}
      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              You Need More Family Members
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              The Weekly Digest unlocks when you have 3+ family members sharing memories together. 
              It's designed to celebrate your growing family story!
            </p>
            
            <div className="bg-brand-50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i <= memberCount ? 'bg-brand-400' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm font-medium text-brand-700">
                {memberCount}/3 family members
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowUnlockModal(false)}
                className="flex-1"
              >
                Later
              </Button>
              <Button 
                onClick={() => {
                  setShowUnlockModal(false)
                  window.location.href = '/people'
                }}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
              >
                Invite Family
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}