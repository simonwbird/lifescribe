import { 
  BarChart3, 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  Puzzle, 
  Activity, 
  Shield 
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { AdminNavItem, AdminRole } from '@/lib/adminTypes'

const adminNavItems: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'FAMILY_ADMIN']
  },
  {
    id: 'people-families',
    label: 'People & Families',
    href: '/admin/people',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'FAMILY_ADMIN']
  },
  {
    id: 'families-overview',
    label: 'Families Overview',
    href: '/admin/families',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN']
  },
  {
    id: 'content-media',
    label: 'Content & Media',
    href: '/admin/content',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'FAMILY_ADMIN']
  },
  {
    id: 'growth-digests',
    label: 'Growth & Digests',
    href: '/admin/growth',
    icon: TrendingUp,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN']
  },
  {
    id: 'activation',
    label: 'Activation (TTV)',
    href: '/admin/activation',
    icon: TrendingUp,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN']
  },
  {
    id: 'nudges',
    label: 'Nudge Orchestrator',
    href: '/admin/nudges',
    icon: TrendingUp,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN']
  },
  {
    id: 'flags-config',
    label: 'Flags & Config',
    href: '/admin/config',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN']
  },
  {
    id: 'integrations',
    label: 'Integrations',
    href: '/admin/integrations',
    icon: Puzzle,
    roles: ['SUPER_ADMIN']
  },
  {
    id: 'ops-observability',
    label: 'Ops & Observability',
    href: '/admin/ops',
    icon: Activity,
    roles: ['SUPER_ADMIN']
  },
  {
    id: 'compliance-audit',
    label: 'Compliance & Audit',
    href: '/admin/audit',
    icon: Shield,
    roles: ['SUPER_ADMIN']
  }
]

interface AdminNavigationProps {
  userRole: AdminRole
}

export default function AdminNavigation({ userRole }: AdminNavigationProps) {
  const location = useLocation()

  const filteredNavItems = adminNavItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <nav className="space-y-1">
      {filteredNavItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.href || 
          (item.href !== '/admin' && location.pathname.startsWith(item.href))
        
        return (
          <NavLink
            key={item.id}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}