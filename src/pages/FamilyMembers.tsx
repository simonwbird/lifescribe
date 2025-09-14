import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import InviteModal from '@/components/InviteModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Crown, User, Eye } from 'lucide-react'
import type { Member, Profile, Family } from '@/lib/types'

type MemberWithProfile = Member & { 
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> 
}

export default function FamilyMembers() {
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<MemberWithProfile[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    const getFamilyAndMembers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setCurrentUser(user)

        // Get user's membership and family info
        const { data: currentMember } = await supabase
          .from('members')
          .select(`
            *,
            families (*)
          `)
          .eq('profile_id', user.id)
          .single()

        if (!currentMember) return

        setFamily(currentMember.families)
        setCurrentUserRole(currentMember.role)

        // Get all family members
        const { data: membersData } = await supabase
          .from('members')
          .select(`
            *,
            profiles (id, full_name, avatar_url)
          `)
          .eq('family_id', currentMember.family_id)
          .order('joined_at')

        if (membersData) {
          setMembers(membersData)
        }
      } catch (error) {
        console.error('Error fetching family data:', error)
      } finally {
        setLoading(false)
      }
    }

    getFamilyAndMembers()
  }, [])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />
      case 'member':
        return <User className="h-4 w-4" />
      case 'guest':
        return <Eye className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'member':
        return 'secondary'
      case 'guest':
        return 'outline'
      default:
        return 'secondary'
    }
  }

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
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">{family?.name}</h1>
                <p className="text-muted-foreground">{family?.description}</p>
              </div>
              {currentUserRole === 'admin' && (
                <Button onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardHeader className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarImage src={member.profiles.avatar_url || ''} />
                      <AvatarFallback className="text-lg">
                        {member.profiles.full_name?.charAt(0) || 'FM'}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">
                      {member.profiles.full_name || 'Family Member'}
                    </CardTitle>
                    <CardDescription>
                      {member.profile_id === currentUser?.id ? currentUser.email : 'Family Member'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <Badge variant={getRoleColor(member.role)} className="flex items-center gap-1 w-fit mx-auto">
                      {getRoleIcon(member.role)}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {members.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>No Members Yet</CardTitle>
                  <CardDescription>
                    Invite family members to start sharing memories together.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentUserRole === 'admin' && (
                    <Button onClick={() => setShowInviteModal(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Your First Member
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {showInviteModal && family && (
          <InviteModal
            familyId={family.id}
            onClose={() => setShowInviteModal(false)}
            onInviteSent={() => {
              setShowInviteModal(false)
              // Could refresh the page or show a success message
            }}
          />
        )}
      </div>
    </AuthGate>
  )
}