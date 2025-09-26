import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import EnhancedInviteModal from '@/components/invitations/EnhancedInviteModal'
import InvitationManager from '@/components/invitations/InvitationManager'
import { Plus, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Family {
  id: string
  name: string
}

interface UserRole {
  role: 'admin' | 'contributor' | 'member' | 'viewer' | 'guest'
  family_id: string
}

export default function FamilyInvitations() {
  const [family, setFamily] = useState<Family | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    loadFamilyData()
  }, [])

  const loadFamilyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/auth')
        return
      }

      // Get user's family membership
      const { data: membership, error: membershipError } = await supabase
        .from('members')
        .select('role, family_id, families(id, name)')
        .eq('profile_id', user.id)
        .single()

      if (membershipError) {
        throw membershipError
      }

      if (!membership || !membership.families) {
        toast({
          title: "No family found",
          description: "You need to be a member of a family to manage invitations",
          variant: "destructive"
        })
        navigate('/home')
        return
      }

      setFamily({
        id: membership.families.id,
        name: membership.families.name
      })
      
      setUserRole({
        role: membership.role,
        family_id: membership.family_id
      })

    } catch (error: any) {
      console.error('Error loading family data:', error)
      toast({
        title: "Error",
        description: "Failed to load family information",
        variant: "destructive"
      })
      navigate('/home')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteSent = () => {
    setShowInviteModal(false)
    // The InvitationManager will automatically refresh its data
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!family || !userRole) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Unable to load family information
                </p>
                <Button 
                  onClick={() => navigate('/home')} 
                  className="mt-4"
                >
                  Go Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/home')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Family Invitations</h1>
                  <p className="text-muted-foreground">
                    Manage invitations and members for {family.name}
                  </p>
                </div>
              </div>
              
              {userRole.role === 'admin' && (
                <Button onClick={() => setShowInviteModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              )}
            </div>

            {/* Permission Notice for Non-Admins */}
            {userRole.role !== 'admin' && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <p className="text-sm text-muted-foreground">
                      You can view invitations and members, but only family admins can send invitations or change roles.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invitation Manager */}
            <InvitationManager 
              familyId={family.id}
              currentUserRole={userRole.role as any}
            />

          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <EnhancedInviteModal
            familyId={family.id}
            familyName={family.name}
            onClose={() => setShowInviteModal(false)}
            onInviteSent={handleInviteSent}
         />
       )}
     </div>
   )
 }