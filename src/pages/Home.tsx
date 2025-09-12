import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import WelcomeHeader from '@/components/home/WelcomeHeader'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useMobile } from '@/hooks/use-mobile'
import {
  mockLastVisit,
  mockActivityItems,
  mockDraftItems,
  mockSpaceSummaries,
  mockSuggestions,
  mockUpcomingItems
} from '@/lib/homeTypes'

export default function Home() {
  const [isSimpleMode, setIsSimpleMode] = useState(false)
  const { track } = useAnalytics()
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  // Load simple mode preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('simple-mode')
    if (savedMode !== null) {
      setIsSimpleMode(JSON.parse(savedMode))
    }
  }, [])

  // Save simple mode preference
  const toggleSimpleMode = () => {
    const newMode = !isSimpleMode
    setIsSimpleMode(newMode)
    localStorage.setItem('simple-mode', JSON.stringify(newMode))
    track('simple_mode_toggled', { enabled: newMode })
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <WelcomeHeader 
              firstName="Simon"
              lastVisit={mockLastVisit}
              isSimpleMode={isSimpleMode}
            />
            
            <div className="flex items-center space-x-2">
              <Switch
                id="simple-mode"
                checked={isSimpleMode}
                onCheckedChange={toggleSimpleMode}
              />
              <Label htmlFor="simple-mode" className="text-sm font-medium">
                Simple Mode
              </Label>
            </div>
          </div>

          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">LifeScribe Family Hub v2</h2>
            <p className="text-muted-foreground mb-8">Your elder-friendly family dashboard</p>
            
            <div className="grid gap-4 max-w-md mx-auto">
              <Button size="lg" onClick={() => window.location.href = '/stories/new'}>
                Share a Story (S)
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.location.href = '/photos/upload'}>
                Upload Photos (U)
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.location.href = '/prompts/new'}>
                Ask the Family (Q)
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.location.href = '/collections'}>
                View Collections
              </Button>
            </div>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}