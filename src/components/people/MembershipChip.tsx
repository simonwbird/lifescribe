import { Badge } from '@/components/ui/badge'
import { Crown, User, Shield, Heart, Clock, Mail } from 'lucide-react'
import type { Person } from '@/lib/familyTreeTypes'

interface MembershipChipProps {
  person: Person & { 
    account_status?: string
    member_role?: string | null
  }
}

export default function MembershipChip({ person }: MembershipChipProps) {
  // Handle deceased status first
  if (person.is_living === false) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
        <Heart className="h-3 w-3 mr-1" />
        Deceased
      </Badge>
    )
  }

  // Handle account status and roles for living people
  if (person.account_status === 'joined' && person.member_role) {
    switch (person.member_role) {
      case 'admin':
        return (
          <Badge variant="default" className="bg-red-50 text-red-700 border-red-200">
            <Crown className="h-3 w-3 mr-1" />
            Joined • Admin
          </Badge>
        )
      case 'member':
        return (
          <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
            <User className="h-3 w-3 mr-1" />
            Joined
          </Badge>
        )
      case 'guest':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Shield className="h-3 w-3 mr-1" />
            Guest
          </Badge>
        )
    }
  }

  if (person.account_status === 'invited') {
    return (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        <Clock className="h-3 w-3 mr-1" />
        Invited • Pending
      </Badge>
    )
  }

  // Default: Not on app
  return (
    <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200">
      <Mail className="h-3 w-3 mr-1" />
      Not on app
    </Badge>
  )
}