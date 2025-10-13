import { useEffect, useState } from 'react'
import ThisWeeksCaptures from './ThisWeeksCaptures'
import Suggestions from './Suggestions'
import Upcoming from './Upcoming'
import { UncitedStoriesWidget } from '@/components/citations/UncitedStoriesWidget'
import { supabase } from '@/integrations/supabase/client'

export default function RightRail() {
  const [familyId, setFamilyId] = useState<string | null>(null)

  useEffect(() => {
    const fetchFamilyId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (data) setFamilyId(data.family_id)
    }

    fetchFamilyId()
  }, [])

  return (
    <div className="space-y-6">
      <ThisWeeksCaptures />
      {familyId && <UncitedStoriesWidget familyId={familyId} />}
      <Suggestions />
      <Upcoming />
    </div>
  )
}