import { useEffect, useState } from 'react'
import ThisWeeksCaptures from './ThisWeeksCaptures'
import Suggestions from './Suggestions'
import Upcoming from './Upcoming'
import { UncitedStoriesWidget } from '@/components/citations/UncitedStoriesWidget'
import { DataHealthDashboard } from '@/components/admin/DataHealthDashboard'
import { supabase } from '@/integrations/supabase/client'
import VaultProgressMeter from '@/components/vault/VaultProgressMeter'

export default function RightRail() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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
  }, [])

  return (
    <div className="space-y-6">
      <ThisWeeksCaptures />
      {familyId && <VaultProgressMeter familyId={familyId} />}
      {familyId && isAdmin && <DataHealthDashboard familyId={familyId} />}
      {familyId && <UncitedStoriesWidget familyId={familyId} />}
      <Suggestions />
      <Upcoming />
    </div>
  )
}