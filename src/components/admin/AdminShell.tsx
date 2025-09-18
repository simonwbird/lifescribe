import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AdminNavigation from './AdminNavigation'
import AdminGlobalSearch from './AdminGlobalSearch'
import SavedViewsManager from './SavedViewsManager'
import type { AdminRole } from '@/lib/adminTypes'
import { cn } from '@/lib/utils'

export default function AdminShell() {
  const [userRole, setUserRole] = useState<AdminRole>('SUPER_ADMIN') // Mock for demo
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
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
        {/* Top Header */}
        <header className="bg-card border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <AdminGlobalSearch />
          </div>
          
          <SavedViewsManager />
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}