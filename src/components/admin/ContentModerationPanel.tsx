import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Flag, 
  MessageSquare, 
  FileText, 
  Image,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface ContentItem {
  id: string
  type: 'story' | 'comment' | 'media'
  title?: string
  content: string
  author: string
  family_id: string
  created_at: string
  is_hidden?: boolean
  flag_count?: number
}

export default function ContentModerationPanel() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [moderationReason, setModerationReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { track } = useAnalytics()
  const { toast } = useToast()

  // Mock data - in real app, this would come from an API
  const mockContent: ContentItem[] = [
    {
      id: '1',
      type: 'story',
      title: 'My Summer Vacation',
      content: 'Had an amazing time at the beach with family...',
      author: 'John Doe',
      family_id: 'family-1',
      created_at: '2024-01-15T10:00:00Z',
      flag_count: 2
    },
    {
      id: '2',
      type: 'comment',
      content: 'This is inappropriate content that needs review',
      author: 'Jane Smith',
      family_id: 'family-2',
      created_at: '2024-01-14T15:30:00Z',
      flag_count: 5
    },
    {
      id: '3',
      type: 'story',
      title: 'Family Recipe',
      content: 'Here is my grandmother\'s secret recipe...',
      author: 'Mike Johnson',
      family_id: 'family-3',
      created_at: '2024-01-13T09:15:00Z',
      is_hidden: true
    }
  ]

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'story': return <FileText className="h-4 w-4" />
      case 'comment': return <MessageSquare className="h-4 w-4" />
      case 'media': return <Image className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (item: ContentItem) => {
    if (item.is_hidden) {
      return <Badge variant="secondary">Hidden</Badge>
    }
    if (item.flag_count && item.flag_count > 0) {
      return <Badge variant="destructive">{item.flag_count} flags</Badge>
    }
    return <Badge variant="outline">Active</Badge>
  }

  const handleHideContent = async (itemId: string, reason: string) => {
    setIsLoading(true)
    try {
      track('admin_action' as any)
      
      // Here you would call your API to hide the content
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
      
      toast({
        title: 'Content Hidden',
        description: 'The content has been hidden from public view.',
      })
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to hide content. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setModerationReason('')
    }
  }

  const handleDeleteContent = async (itemId: string, reason: string) => {
    setIsLoading(true)
    try {
      track('admin_action' as any)
      
      // Here you would call your API to delete the content
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
      
      toast({
        title: 'Content Deleted',
        description: 'The content has been permanently removed.',
      })
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete content. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setModerationReason('')
    }
  }

  const handleUnhideContent = async (itemId: string) => {
    try {
      track('admin_action' as any)
      
      // Here you would call your API to unhide the content
      await new Promise(resolve => setTimeout(resolve, 500)) // Mock delay
      
      toast({
        title: 'Content Restored',
        description: 'The content is now visible to users.',
      })
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore content. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const filteredContent = mockContent.filter(item => {
    const matchesSearch = !searchQuery || 
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTab = selectedTab === 'all' || 
      (selectedTab === 'flagged' && item.flag_count && item.flag_count > 0) ||
      (selectedTab === 'hidden' && item.is_hidden)
    
    return matchesSearch && matchesTab
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">Monitor and moderate user-generated content</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content, authors, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
          <TabsTrigger value="hidden">Hidden</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ContentList 
            items={filteredContent}
            onHide={handleHideContent}
            onDelete={handleDeleteContent}
            onUnhide={handleUnhideContent}
            isLoading={isLoading}
            moderationReason={moderationReason}
            setModerationReason={setModerationReason}
            getItemIcon={getItemIcon}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <ContentList 
            items={filteredContent}
            onHide={handleHideContent}
            onDelete={handleDeleteContent}
            onUnhide={handleUnhideContent}
            isLoading={isLoading}
            moderationReason={moderationReason}
            setModerationReason={setModerationReason}
            getItemIcon={getItemIcon}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="hidden" className="space-y-4">
          <ContentList 
            items={filteredContent}
            onHide={handleHideContent}
            onDelete={handleDeleteContent}
            onUnhide={handleUnhideContent}
            isLoading={isLoading}
            moderationReason={moderationReason}
            setModerationReason={setModerationReason}
            getItemIcon={getItemIcon}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ContentListProps {
  items: ContentItem[]
  onHide: (id: string, reason: string) => void
  onDelete: (id: string, reason: string) => void
  onUnhide: (id: string) => void
  isLoading: boolean
  moderationReason: string
  setModerationReason: (reason: string) => void
  getItemIcon: (type: string) => JSX.Element
  getStatusBadge: (item: ContentItem) => JSX.Element
}

function ContentList({ 
  items, 
  onHide, 
  onDelete, 
  onUnhide, 
  isLoading,
  moderationReason,
  setModerationReason,
  getItemIcon,
  getStatusBadge
}: ContentListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No content found</h3>
          <p className="text-muted-foreground">No content matches your current filters.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getItemIcon(item.type)}
                  <span className="font-medium text-sm capitalize">{item.type}</span>
                  {getStatusBadge(item)}
                </div>
                
                {item.title && (
                  <h3 className="font-medium mb-1">{item.title}</h3>
                )}
                
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {item.content}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>By {item.author}</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <span>Family: {item.family_id}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {item.is_hidden ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUnhide(item.id)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Unhide
                  </Button>
                ) : (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2">
                          <EyeOff className="h-4 w-4" />
                          Hide
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Hide Content</DialogTitle>
                          <DialogDescription>
                            This will hide the content from users but not delete it permanently.
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="Reason for hiding this content..."
                          value={moderationReason}
                          onChange={(e) => setModerationReason(e.target.value)}
                        />
                        <DialogFooter>
                          <Button
                            onClick={() => onHide(item.id, moderationReason)}
                            disabled={!moderationReason.trim() || isLoading}
                          >
                            {isLoading ? 'Hiding...' : 'Hide Content'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Content</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The content will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                          placeholder="Reason for deleting this content..."
                          value={moderationReason}
                          onChange={(e) => setModerationReason(e.target.value)}
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(item.id, moderationReason)}
                            disabled={!moderationReason.trim() || isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isLoading ? 'Deleting...' : 'Delete Forever'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}