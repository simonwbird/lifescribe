import { useEffect, useState } from 'react'
import ThisWeeksCaptures from './ThisWeeksCaptures'
import Suggestions from './Suggestions'
import Upcoming from './Upcoming'
import { UncitedStoriesWidget } from '@/components/citations/UncitedStoriesWidget'
import { DataHealthDashboard } from '@/components/admin/DataHealthDashboard'
import { supabase } from '@/integrations/supabase/client'
import VaultProgressMeter from '@/components/vault/VaultProgressMeter'
import { QuickActions } from './QuickActions'

interface RightRailProps {
  familyId?: string
  userId?: string
}

export default function RightRail({ familyId: propFamilyId, userId: propUserId }: RightRailProps = {}) {
  const [familyId, setFamilyId] = useState<string | null>(propFamilyId || null)
  const [userId, setUserId] = useState<string | null>(propUserId || null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // If props are provided, use them
    if (propFamilyId && propUserId) {
      setFamilyId(propFamilyId)
      setUserId(propUserId)
      // Still fetch role info
      const fetchRole = async () => {
        const { data } = await supabase
          .from('members')
          .select('role')
          .eq('profile_id', propUserId)
          .eq('family_id', propFamilyId)
          .single()
        
        if (data) {
          setIsAdmin(data.role === 'admin')
        }
      }
      fetchRole()
      return
    }

    // Otherwise fetch everything
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data } = await supabase
        .from('members')
        .select('family_id, role')
        .eq('profile_id', user.id)
        .single()

      if (data) {
        setFamilyId(data.family_id)
        setIsAdmin(data.role === 'admin')
      }
    }

    fetchUserData()
  }, [propFamilyId, propUserId])

  return (
    <div className="space-y-4">
      {familyId && userId && <QuickActions familyId={familyId} userId={userId} />}
      <ThisWeeksCaptures />
      {familyId && <VaultProgressMeter familyId={familyId} />}
      {familyId && isAdmin && <DataHealthDashboard familyId={familyId} />}
      {familyId && <UncitedStoriesWidget familyId={familyId} />}
      <Suggestions />
      <Upcoming />
    </div>
  )
}