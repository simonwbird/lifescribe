import { useState, useEffect } from 'react'
import { Bookmark, Plus, X, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { SavedView } from '@/lib/adminTypes'

export default function SavedViewsManager() {
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [newViewDescription, setNewViewDescription] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { track } = useAnalytics()

  // Load saved views from localStorage (in production, this would be from database)
  useEffect(() => {
    const stored = localStorage.getItem('admin_saved_views')
    if (stored) {
      setSavedViews(JSON.parse(stored))
    }
  }, [])

  // Save to localStorage
  const saveToPersistence = (views: SavedView[]) => {
    localStorage.setItem('admin_saved_views', JSON.stringify(views))
    setSavedViews(views)
  }

  const createSavedView = () => {
    if (!newViewName.trim()) return

    const newView: SavedView = {
      id: crypto.randomUUID(),
      name: newViewName,
      description: newViewDescription,
      filters: {}, // In real app, this would capture current filter state
      route: location.pathname + location.search,
      created_at: new Date().toISOString(),
      created_by: 'current_user' // In real app, get from auth
    }

    const updatedViews = [...savedViews, newView]
    saveToPersistence(updatedViews)

    track('ADMIN_SAVED_VIEW_CREATED' as any, {
      viewName: newView.name,
      route: newView.route
    })

    setNewViewName('')
    setNewViewDescription('')
    setShowCreateModal(false)
  }

  const loadSavedView = (view: SavedView) => {
    navigate(view.route)
    track('ADMIN_SAVED_VIEW_LOADED' as any, {
      viewId: view.id,
      viewName: view.name
    })
  }

  const deleteSavedView = (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedViews = savedViews.filter(v => v.id !== viewId)
    saveToPersistence(updatedViews)
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <BookmarkCheck className="h-4 w-4" />
            Saved Views
            {savedViews.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {savedViews.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {savedViews.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No saved views yet
            </div>
          ) : (
            savedViews.map((view) => (
              <DropdownMenuItem
                key={view.id}
                onClick={() => loadSavedView(view)}
                className="flex items-start justify-between p-3 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {view.name}
                  </div>
                  {view.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {view.description}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(view.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-2"
                  onClick={(e) => deleteSavedView(view.id, e)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Save View
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="view-name">View Name</Label>
              <Input
                id="view-name"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Enter view name"
              />
            </div>
            <div>
              <Label htmlFor="view-description">Description (optional)</Label>
              <Input
                id="view-description"
                value={newViewDescription}
                onChange={(e) => setNewViewDescription(e.target.value)}
                placeholder="Brief description of this view"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={createSavedView} disabled={!newViewName.trim()}>
                Save View
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}