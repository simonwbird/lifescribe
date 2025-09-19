import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Menu, X, Shield, Home, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AdminNavigation from './AdminNavigation'
import AdminGlobalSearch from './AdminGlobalSearch'
import SavedViewsManager from './SavedViewsManager'
import ImpersonationBanner from './ImpersonationBanner'
import type { AdminRole } from '@/lib/adminTypes'
import { cn } from '@/lib/utils'

export default function AdminShell() {
  const [userRole, setUserRole] = useState<AdminRole>('SUPER_ADMIN')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setUserProfile(profile)
      }
    }
    getUserProfile()
  }, [])

  const getPageTitle = () => {
    const path = location.pathname.replace('/admin', '').replace('/', '') || 'dashboard'
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'people': 'People Management', 
      'families': 'Family Overview',
      'content': 'Content & Media',
      'activation': 'Activation Analytics',
      'feature-flags': 'Feature Flags',
      'digest': 'Digest Management',
      'nudges': 'Nudge Orchestrator',
      'moderation': 'Moderation Queue',
      'media-pipeline': 'Media Pipeline',
      'audit': 'Audit & Compliance'
    }
    return titles[path] || 'Admin Panel'
  }

  const getBreadcrumbs = () => {
    const path = location.pathname.replace('/admin', '').replace('/', '') || 'dashboard'
    return [
      { name: 'LifeScribe', href: '/home' },
      { name: 'Super Admin', href: '/admin' },
      { name: getPageTitle(), href: location.pathname }
    ]
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleExitAdmin = () => {
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-semibold">LifeScribe Admin</h1>
              <p className="text-xs text-muted-foreground">{userRole.replace('_', ' ')}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 p-0"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <AdminNavigation userRole={userRole} />
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className={cn(
              "gap-2",
              !sidebarOpen && "w-8 h-8 p-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Platform Header */}
        <header className="bg-card border-b shadow-sm">
          {/* Main Header Bar */}
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Left Section - Platform Branding & Navigation */}
            <div className="flex items-center gap-6">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="mr-2"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              
              {/* Platform Status */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  <div>
                    <div className="font-semibold text-sm">LifeScribe Admin</div>
                    <div className="text-xs text-muted-foreground">Super Admin Console</div>
                  </div>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  All systems operational
                </div>
              </div>

              {/* Breadcrumb Navigation */}
              <nav className="flex items-center gap-2 text-sm">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center gap-2">
                    {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <button
                      onClick={() => navigate(crumb.href)}
                      className={cn(
                        "hover:text-foreground transition-colors",
                        index === getBreadcrumbs().length - 1 
                          ? "text-foreground font-medium" 
                          : "text-muted-foreground"
                      )}
                    >
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </nav>
            </div>

            {/* Right Section - Tools & Profile */}
            <div className="flex items-center gap-4">
              <AdminGlobalSearch />
              <SavedViewsManager />
              
              <div className="h-6 w-px bg-border" />
              
              {/* Admin Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExitAdmin}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Exit Admin
              </Button>

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback>
                    {userProfile?.full_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">{userProfile?.full_name || 'Admin'}</div>
                  <div className="text-xs text-muted-foreground">Super Admin</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Page Title Bar */}
          <div className="px-6 py-3 bg-muted/50 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
                <p className="text-sm text-muted-foreground">
                  {location.pathname === '/admin' && 'Overview of system health and key metrics'}
                  {location.pathname === '/admin/people' && 'Manage users, profiles, and access permissions'}
                  {location.pathname === '/admin/families' && 'Monitor family groups and membership'}
                  {location.pathname === '/admin/content' && 'Review and moderate platform content'}
                  {location.pathname === '/admin/activation' && 'Track user activation and engagement'}
                  {location.pathname === '/admin/feature-flags' && 'Control feature rollouts and experiments'}
                  {location.pathname === '/admin/digest' && 'Configure email digests and notifications'}
                  {location.pathname === '/admin/nudges' && 'Manage user engagement campaigns'}
                  {location.pathname === '/admin/moderation' && 'Review flagged content and take action'}
                  {location.pathname === '/admin/media-pipeline' && 'Monitor media processing and AI services'}
                  {location.pathname === '/admin/audit' && 'Review audit logs and compliance reports'}
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <ImpersonationBanner />
          <Outlet />
        </main>
      </div>
    </div>
  )
}