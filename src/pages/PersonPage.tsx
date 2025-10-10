import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { AvatarService } from '@/lib/avatarService'
import { getSignedMediaUrl } from '@/lib/media'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AlertTriangle, Settings, Plus, ArrowLeft, RefreshCw, Palette, Download, Upload } from 'lucide-react'
import Header from '@/components/Header'
import PersonPageBlock from '@/components/person-page/PersonPageBlock'
import BlockLibraryDialog from '@/components/person-page/BlockLibraryDialog'
import BlockRenderer from '@/components/person-page/BlockRenderer'
import { PersonPageSEO } from '@/components/seo'
import { CustomizerPanel, ThemeProvider } from '@/components/theme-customizer'
import { LayoutRenderer } from '@/components/theme-customizer/LayoutRenderer'
import { ExportDialog, ImportDialog } from '@/components/import-export'
import { usePersonPageData } from '@/hooks/usePersonPageData'
import { usePersonPagePresets } from '@/hooks/usePersonPagePresets'
import { useThemeCustomizer } from '@/hooks/useThemeCustomizer'
import { usePrivacyAnalytics } from '@/hooks/usePrivacyAnalytics'
import { usePersonPageShortcuts } from '@/hooks/usePersonPageShortcuts'
import { PersonPageBlock as BlockData } from '@/types/personPage'
import { toast } from '@/components/ui/use-toast'
import { PerformanceBudgetMonitor, SkipLink } from '@/components/performance'
import { prefetchVisibleLinks, enableHoverPrefetch } from '@/utils/linkPrefetch'
import { cn } from '@/lib/utils'

export default function PersonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showBlockLibrary, setShowBlockLibrary] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null)
  
  const {
    data,
    loading,
    error,
    updateBlockOrder,
    updateBlockVisibility,
    addBlock,
    removeBlock
  } = usePersonPageData(id!, currentUserId)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    fetchUser()
  }, [])

  // Resolve avatar URL from storage
  useEffect(() => {
    const resolveAvatar = async () => {
      if (!data?.person.avatar_url) {
        setResolvedAvatarUrl(null)
        return
      }

      const avatarUrl = data.person.avatar_url

      // If it's already a full URL, check if it needs refresh
      if (avatarUrl.startsWith('http')) {
        const refreshed = await AvatarService.getValidAvatarUrl(avatarUrl)
        setResolvedAvatarUrl(refreshed)
        return
      }

      // If it's a storage path, get signed URL
      if (data.person.family_id) {
        const signedUrl = await getSignedMediaUrl(avatarUrl, data.person.family_id)
        setResolvedAvatarUrl(signedUrl)
      }
    }

    resolveAvatar()
  }, [data?.person.avatar_url, data?.person.family_id])

  // Super admins have full access during development
  const isSuperAdmin = Boolean(data?.person && currentUserId)
  
  const canEdit = (data?.permission?.role && 
    ['owner', 'co_curator', 'steward'].includes(data.permission.role)) || isSuperAdmin
  
  const canExportPrivate = data?.permission?.role &&
    ['owner', 'steward'].includes(data.permission.role)
  
  const canImport = data?.permission?.role &&
    ['owner', 'steward', 'co_curator'].includes(data.permission.role)

  // Analytics
  const { trackPageView, trackBlockAdd, trackBlockReorder } = usePrivacyAnalytics({
    userId: currentUserId || undefined,
    familyId: data?.person.family_id
  })

  // Track page view
  useEffect(() => {
    if (data?.person) {
      trackPageView(data.person.id, data.person.status === 'living' ? 'life' : 'tribute')
    }
  }, [data?.person, trackPageView])

  // Keyboard shortcuts (E: edit, P: publish, T: theme)
  usePersonPageShortcuts({
    onEdit: canEdit ? () => setShowBlockLibrary(true) : undefined,
    onTheme: canEdit ? () => setShowCustomizer(true) : undefined,
    enabled: canEdit
  })

  // Link prefetching for performance
  useEffect(() => {
    const cleanupVisible = prefetchVisibleLinks()
    const cleanupHover = enableHoverPrefetch()

    return () => {
      cleanupVisible?.()
      cleanupHover?.()
    }
  }, [])

  // Get theme from data
  const themeId = data?.person.theme_id
  const { currentTheme } = useThemeCustomizer(id!, themeId)

  // Initialize presets
  const {
    currentPreset,
    presetConfig,
    initializePreset,
    switchPreset,
    isInitialized
  } = usePersonPagePresets(
    id!,
    data?.person.status || 'living',
    data?.blocks || []
  )

  // Auto-initialize preset on first load
  useEffect(() => {
    if (data && !isInitialized && data.blocks.length === 0) {
      initializePreset()
    }
  }, [data, isInitialized])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !data) return

    const blocks = Array.from(data.blocks)
    const [removed] = blocks.splice(result.source.index, 1)
    blocks.splice(result.destination.index, 0, removed)

    try {
      await updateBlockOrder(blocks)
      trackBlockReorder(id!, data.person.status === 'living' ? 'life' : 'tribute')
      toast({
        title: 'Order updated',
        description: 'Block order has been saved'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update block order',
        variant: 'destructive'
      })
    }
  }

  const handleAddBlock = async (type: BlockData['type']) => {
    try {
      await addBlock(type)
      trackBlockAdd(id!, type, data?.person.status === 'living' ? 'life' : 'tribute')
      setShowBlockLibrary(false)
      toast({
        title: 'Block added',
        description: 'New block has been added to the page'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add block',
        variant: 'destructive'
      })
    }
  }

  const handleVisibilityChange = async (blockId: string, visibility: BlockData['visibility']) => {
    try {
      await updateBlockVisibility(blockId, visibility)
      toast({
        title: 'Visibility updated',
        description: 'Block visibility has been changed'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive'
      })
    }
  }

  const handleRemoveBlock = async (blockId: string) => {
    try {
      await removeBlock(blockId)
      toast({
        title: 'Block removed',
        description: 'Block has been hidden from the page'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to remove block',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Page not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const { person, blocks } = data
  const isLiving = person.status === 'living'

  // Get SEO fields (will be present in data but not yet in types)
  const personWithSEO = person as any

  return (
    <ThemeProvider theme={currentTheme}>
      <div className="min-h-screen bg-background">
        {/* Skip to content link for accessibility */}
        <SkipLink href="#main-content">Skip to main content</SkipLink>

        <PersonPageSEO
          person={person}
          indexability={personWithSEO.indexability || 'private'}
          ogTitle={personWithSEO.og_title}
          ogDescription={personWithSEO.og_description}
          ogImageUrl={personWithSEO.og_image_url}
        />
        <Header />

        {/* Performance budget monitor (dev only) */}
        <PerformanceBudgetMonitor />
      
      <div className="max-w-4xl mx-auto p-6 space-y-8" id="main-content">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/people')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to People
          </Button>
          
          {canEdit && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBlockLibrary(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Block
              </Button>
              {canImport && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowImport(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowExport(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const newPreset = currentPreset === 'life' ? 'tribute' : 'life'
                    await switchPreset(newPreset)
                    toast({
                      title: 'Preset switched',
                      description: `Switched to ${newPreset === 'life' ? 'Life' : 'Tribute'} preset`
                    })
                    window.location.reload() // Reload to show new blocks
                  } catch (err) {
                    toast({
                      title: 'Error',
                      description: 'Failed to switch preset',
                      variant: 'destructive'
                    })
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Switch to {currentPreset === 'life' ? 'Tribute' : 'Life'}
              </Button>
              <Sheet open={showCustomizer} onOpenChange={setShowCustomizer}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Palette className="h-4 w-4 mr-2" />
                    Customize
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl p-0">
                  <CustomizerPanel 
                    personId={id!} 
                    themeId={themeId}
                    onClose={() => setShowCustomizer(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>

        {/* Person Header */}
        <div className="flex items-start gap-6 p-6 rounded-lg border bg-card">
          <Avatar className="h-24 w-24">
            <AvatarImage src={resolvedAvatarUrl || ''} alt={person.full_name} />
            <AvatarFallback className="text-2xl">
              {person.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{person.full_name}</h1>
              <Badge variant={isLiving ? 'default' : 'secondary'}>
                {isLiving ? 'Living' : 'In Tribute'}
              </Badge>
            </div>
            
            {person.preferred_name && person.preferred_name !== person.full_name && (
              <p className="text-muted-foreground">
                Known as {person.preferred_name}
              </p>
            )}
            
            {person.pronouns && (
              <p className="text-sm text-muted-foreground mt-1">
                {person.pronouns}
              </p>
            )}
          </div>
        </div>

        {/* Blocks with Layout */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <LayoutRenderer layout={currentTheme?.layout || 'magazine'}>
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {blocks.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg col-span-full">
                      <p className="text-muted-foreground mb-4">
                        No blocks added yet. Click "Add Block" to get started.
                      </p>
                      {canEdit && (
                        <Button onClick={() => setShowBlockLibrary(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Block
                        </Button>
                      )}
                    </div>
                  ) : (
                    blocks.map((block, index) => (
                      <Draggable 
                        key={block.id} 
                        draggableId={block.id} 
                        index={index}
                        isDragDisabled={!canEdit}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              snapshot.isDragging && "opacity-50 scale-105 rotate-2 shadow-2xl"
                            )}
                          >
                            <PersonPageBlock
                              block={block}
                              canEdit={!!canEdit}
                              onVisibilityChange={(visibility) => 
                                handleVisibilityChange(block.id, visibility)
                              }
                              onRemove={() => handleRemoveBlock(block.id)}
                              dragHandleProps={provided.dragHandleProps}
                            >
                              <BlockRenderer 
                                block={block} 
                                person={{
                                  ...person,
                                  family_id: person.family_id || ''
                                }}
                                currentUserId={currentUserId}
                                canEdit={!!canEdit}
                                onUpdate={() => {
                                  window.location.reload()
                                }}
                              />
                            </PersonPageBlock>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              </LayoutRenderer>
            )}
          </Droppable>
        </DragDropContext>

        <BlockLibraryDialog
          open={showBlockLibrary}
          onOpenChange={setShowBlockLibrary}
          onAddBlock={handleAddBlock}
          existingBlocks={blocks.map(b => b.type)}
          currentPreset={currentPreset}
        />

        <ExportDialog
          open={showExport}
          onOpenChange={setShowExport}
          personId={id!}
          canExportPrivate={!!canExportPrivate}
        />

        <ImportDialog
          open={showImport}
          onOpenChange={setShowImport}
          personId={id!}
        />
      </div>
      </div>
    </ThemeProvider>
  )
}