import { ReactNode } from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { LeftNav } from '@/components/navigation/LeftNav'
import { Menu } from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  showHeader?: boolean
}

export function AppLayout({ children, showSidebar = true, showHeader = true }: AppLayoutProps) {
  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <LeftNav />
        
        <div className="flex-1 flex flex-col min-w-0">
          {showHeader && (
            <header 
              role="banner"
              className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4"
            >
              <SidebarTrigger className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation sidebar</span>
              </SidebarTrigger>
            </header>
          )}
          
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
