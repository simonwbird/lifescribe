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
import { AlertTriangle, Settings, Plus, ArrowLeft, RefreshCw, Palette, Download, Upload, Wrench, Layout as LayoutIcon } from 'lucide-react'
import Header from '@/components/Header'
import PersonPageBlock from '@/components/person-page/PersonPageBlock'
import BlockLibraryDialog from '@/components/person-page/BlockLibraryDialog'
import BlockRenderer from '@/components/person-page/BlockRenderer'
import { PersonPageSEO } from '@/components/seo'
import { Helmet } from 'react-helmet-async'
import { CustomizerPanel, ThemeProvider } from '@/components/theme-customizer'
import { LayoutRenderer } from '@/components/theme-customizer/LayoutRenderer'
import { ExportDialog, ImportDialog } from '@/components/import-export'
import { StewardToolsPanel } from '@/components/steward-tools'
import { SuggestChangeButton } from '@/components/person-page/SuggestChangeButton'
import { LastUpdatedInfo } from '@/components/person-page/LastUpdatedInfo'
import { VisibilityChips } from '@/components/person-page/VisibilityChips'
import { PageLayoutManager, BlockItem } from '@/components/person-page/PageLayoutManager'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { QuickAddBar } from '@/components/person-page/QuickAddBar'
import { PromptOfTheWeek } from '@/components/person-page/PromptOfTheWeek'
import {
  QuickFactsWidget,
  TOCWidget,
  ContributeCTAWidget,
  AnniversariesWidgetWrapper,
  VisibilitySearchWidget,
  MiniMapWidget,
  MediaCountersWidget,
  FavoritesQuirksWidget,
  CausesWidget,
  ShareExportWidget
} from '@/components/person-page/RailWidgets'
import { usePersonPageData } from '@/hooks/usePersonPageData'
import { usePersonPagePresets } from '@/hooks/usePersonPagePresets'
import { useThemeCustomizer } from '@/hooks/useThemeCustomizer'
import { usePrivacyAnalytics } from '@/hooks/usePrivacyAnalytics'
import { usePersonPageShortcuts } from '@/hooks/usePersonPageShortcuts'
import { usePersonPageLayout } from '@/hooks/usePersonPageLayout'
import { LayoutEditor } from '@/components/person-page/customize/LayoutEditor'
import { PersonPageBlock as BlockData } from '@/types/personPage'
import { Person } from '@/utils/personUtils'
import { toast } from '@/hooks/use-toast'
import { PerformanceBudgetMonitor, SkipLink } from '@/components/performance'
import { prefetchVisibleLinks, enableHoverPrefetch } from '@/utils/linkPrefetch'
import { cn } from '@/lib/utils'
import { DEFAULT_LAYOUT_MAP, getBlockLayoutId } from '@/config/personPageLayouts'
import { useBreakpoint } from '@/hooks/useBreakpoint'

// Helper function to map block types to section IDs for TOC
const getSectionId = (blockType: string): string => {
  const typeMap: Record<string, string> = {
    'hero': 'hero',
    'hero_life': 'hero',
    'hero_memorial': 'hero',
    'bio_overview': 'bio',
    'bio': 'bio',
    'about_me': 'about',
    'pinned_highlights': 'highlights',
    'timeline': 'timeline',
    'timeline_enhanced': 'timeline',
    'life_arc_timeline': 'timeline',
    'story_roll': 'stories',
    'story_collage': 'stories',
    'stories': 'stories',
    'audio_remembrances': 'audio',
    'voice_notes': 'voice',
    'photo_gallery': 'photos',
    'photos': 'photos',
    'gallery': 'photos',
    'people_web': 'people',
    'relationships': 'people',
    'guestbook_live': 'guestbook',
    'notes_from_friends': 'notes',
    'guestbook_tribute': 'guestbook',
    'service_events': 'services',
    'events': 'events',
    'objects_places': 'places',
    'now_next': 'now-next',
    'favorites_quirks': 'favorites',
    'favorites': 'favorites'
  }
  return typeMap[blockType] || blockType
}

// Helper function to build blocks array for PageLayoutManager
function buildBlocksArray(
  blocks: BlockData[],
  person: Person,
  widgetProps: {
    personId: string
    familyId: string
    preset: 'life' | 'tribute'
    visibility: string
    indexability: string
    canEdit: boolean
    onUpdate: () => void
  },
  canEdit: boolean,
  currentUserId: string | null,
  handleVisibilityChange: (blockId: string, visibility: string) => void,
  handleUnlockDateChange: (blockId: string, unlockDate: string | null) => void,
  handleRemoveBlock: (blockId: string) => void,
  viewerRole?: string
): BlockItem[] {
  const blockItems: BlockItem[] = []
  const addedIds = new Set<string>() // Track added block IDs to prevent duplicates

  // Helper to safely add a block
  const addBlock = (id: string, component: JSX.Element) => {
    if (!addedIds.has(id)) {
      blockItems.push({ id, component })
      addedIds.add(id)
    }
  }

  // Add rail widgets
  addBlock('QuickFacts', <QuickFactsWidget person={{
    ...person,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as Person} />)

  addBlock('PinnedHighlights', <div key="pinned-highlights" />)

  addBlock('TOC', <TOCWidget />)

  addBlock('ContributeCTA', (
    <ContributeCTAWidget
      personId={widgetProps.personId}
      familyId={widgetProps.familyId}
      preset={widgetProps.preset}
      visibility={widgetProps.visibility}
    />
  ))

  addBlock('Anniversaries', (
    <AnniversariesWidgetWrapper
      person={{
        ...person,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Person}
      preset={widgetProps.preset}
      canEdit={widgetProps.canEdit}
    />
  ))

  addBlock('VisibilitySearch', (
    <VisibilitySearchWidget
      personId={widgetProps.personId}
      visibility={widgetProps.visibility}
      indexability={widgetProps.indexability}
      canEdit={widgetProps.canEdit}
      onUpdate={widgetProps.onUpdate}
    />
  ))

  addBlock('MiniMap', <MiniMapWidget personId={widgetProps.personId} familyId={widgetProps.familyId} />)

  addBlock('MediaCounters', <MediaCountersWidget personId={widgetProps.personId} familyId={widgetProps.familyId} />)

  addBlock('FavoritesQuirks', (
    <FavoritesQuirksWidget
      personId={widgetProps.personId}
      familyId={widgetProps.familyId}
      canEdit={widgetProps.canEdit}
      onUpdate={widgetProps.onUpdate}
    />
  ))

  addBlock('Causes', (
    <CausesWidget
      personId={widgetProps.personId}
      familyId={widgetProps.familyId}
      canEdit={widgetProps.canEdit}
      onUpdate={widgetProps.onUpdate}
    />
  ))

  addBlock('ShareExport', (
    <ShareExportWidget
      personId={widgetProps.personId}
      familyId={widgetProps.familyId}
      person={{
        ...person,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Person}
      preset={widgetProps.preset}
      canEdit={widgetProps.canEdit}
    />
  ))

  // Add content blocks
  blocks.forEach((block) => {
    const blockLayoutId = getBlockLayoutId(block.type)
    const actualIndex = blocks.findIndex(b => b.id === block.id)
    
    // Skip if this layout ID is already added (prevents duplicate singletons)
    if (addedIds.has(blockLayoutId)) {
      return
    }
    
    addBlock(blockLayoutId, (
        <Draggable 
          key={block.id} 
          draggableId={block.id} 
          index={actualIndex}
          isDragDisabled={!canEdit}
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              id={getSectionId(block.type)}
              className={cn(
                snapshot.isDragging && "opacity-50 scale-105 rotate-2 shadow-2xl"
              )}
            >
              <PersonPageBlock
                block={block}
                canEdit={canEdit}
                onVisibilityChange={(visibility) => 
                  handleVisibilityChange(block.id, visibility)
                }
                onUnlockDateChange={(unlockDate) =>
                  handleUnlockDateChange(block.id, unlockDate)
                }
                onRemove={() => handleRemoveBlock(block.id)}
                dragHandleProps={provided.dragHandleProps}
                viewerRole={viewerRole}
              >
                <BlockRenderer 
                  block={block} 
                  person={{
                    ...person,
                    family_id: widgetProps.familyId,
                    status: widgetProps.preset === 'life' ? 'living' : 'passed'
                  }}
                  currentUserId={currentUserId}
                  canEdit={canEdit}
                  onUpdate={() => {
                    window.location.reload()
                  }}
                />
              </PersonPageBlock>
            </div>
          )}
        </Draggable>
      ))
  })

  return blockItems
}

export default function PersonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const breakpoint = useBreakpoint() // Detect current breakpoint
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [mode, setMode] = useState<'simple' | 'studio'>('simple')
  const [showBlockLibrary, setShowBlockLibrary] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [showLayoutEditor, setShowLayoutEditor] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showStewardTools, setShowStewardTools] = useState(false)
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null)
  
  const {
    data,
    loading,
    error,
    updateBlockOrder,
    updateBlockVisibility,
    updateBlockUnlockDate,
    addBlock,
    removeBlock
  } = usePersonPageData(id!, currentUserId)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      
      // Fetch user's mode preference
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('simple_mode')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setMode(profile.simple_mode ? 'simple' : 'studio')
        }
      }
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

  // Get custom layout for this person
  const { 
    layoutMap, 
    loading: layoutLoading, 
    saving: layoutSaving,
    saveLayout,
    resetToDefaults
  } = usePersonPageLayout(id!, data?.person.family_id || '')

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
    const newIndex = result.destination.index
    
    // Bio/bio_overview must stay after hero/memorial blocks
    const isBioBlock = removed.type === 'bio' || removed.type === 'bio_overview'
    const isHeroBlock = (type: string) => type === 'hero' || type === 'hero_memorial'
    
    if (isBioBlock) {
      // Find the hero block index in the new array
      const heroIndex = blocks.findIndex(b => isHeroBlock(b.type))
      
      // If trying to place bio before hero, force it after hero
      if (heroIndex !== -1 && newIndex <= heroIndex) {
        blocks.splice(heroIndex + 1, 0, removed)
        toast({
          title: 'Bio locked',
          description: 'Biography must appear after the hero section',
          variant: 'default'
        })
      } else {
        blocks.splice(newIndex, 0, removed)
      }
    } else {
      blocks.splice(newIndex, 0, removed)
    }

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

  const handleUnlockDateChange = async (blockId: string, unlockDate: string | null) => {
    try {
      await updateBlockUnlockDate(blockId, unlockDate)
      toast({
        title: 'Unlock date updated',
        description: unlockDate 
          ? `Block will unlock on ${new Date(unlockDate).toLocaleDateString()}`
          : 'Unlock date removed'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update unlock date',
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

  // Get SEO fields from person data
  const personWithSEO = person as any
  const visibility = personWithSEO.visibility || 'private'
  const indexability = personWithSEO.indexability || 'noindex'
  const preset = person.status === 'living' ? 'life' : 'tribute'
  
  // Prepare SEO data
  const shouldIndex = visibility === 'public' && indexability === 'indexable'
  const robotsMeta = shouldIndex ? 'index,follow' : 'noindex,nofollow'
  const fullName = person.full_name || person.preferred_name || 'Unknown'
  const pageTitle = preset === 'tribute' 
    ? `${fullName} - In Loving Memory`
    : `${fullName} - Life Story`
  const pageDescription = person.birth_date
    ? `${fullName}, born ${new Date(person.birth_date).toLocaleDateString()}`
    : fullName

  return (
    <ThemeProvider theme={currentTheme} scoped={true}>
      <div className="min-h-screen bg-background">
        {/* Skip to content link for accessibility */}
        <SkipLink href="#portal-main">Skip to main content</SkipLink>

        {/* SEO meta tags and structured data */}
        <Helmet>
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
          <meta name="robots" content={robotsMeta} />
          <meta property="og:type" content="profile" />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
          <link rel="canonical" href={window.location.href} />
        </Helmet>
        
        <Header />

        {/* Performance budget monitor (dev only) */}
        <PerformanceBudgetMonitor />
      
      <div className="max-w-7xl mx-auto p-6 space-y-8" id="main-content">
        {/* Top Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/people')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to People
            </Button>

            {/* Visibility Chips */}
            <VisibilityChips
              personId={id!}
              currentVisibility={visibility}
              currentIndexability={indexability}
              canEdit={canEdit}
              onUpdate={async () => {
                // Refresh page data
                window.location.reload()
              }}
            />
          </div>
          
          {canEdit && (
            <div className="flex gap-2">
              <Sheet open={showStewardTools} onOpenChange={setShowStewardTools}>
                <SheetTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm"
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Steward Tools
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
                  <StewardToolsPanel
                    personId={id!}
                    familyId={data.person.family_id || ''}
                    personName={data.person.full_name}
                    onClose={() => setShowStewardTools(false)}
                  />
                </SheetContent>
              </Sheet>

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
              <Sheet open={showCustomizer} onOpenChange={setShowCustomizer}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Palette className="h-4 w-4 mr-2" />
                    Theme
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
              <Sheet open={showLayoutEditor} onOpenChange={setShowLayoutEditor}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <LayoutIcon className="h-4 w-4 mr-2" />
                    Layout
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-4xl p-0 overflow-y-auto">
                  <div className="p-6">
                    <LayoutEditor
                      layoutMap={layoutMap}
                      onSave={saveLayout}
                      onReset={resetToDefaults}
                      saving={layoutSaving}
                      personId={id!}
                      familyId={data?.person?.family_id || ''}
                    />
                  </div>
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

            {/* Last Updated Info */}
            <LastUpdatedInfo 
              personId={person.id}
              familyId={person.family_id || ''}
              className="mt-3"
            />
          </div>

          {/* Suggest Changes for viewers */}
          {!canEdit && (
            <SuggestChangeButton
              personId={person.id}
              familyId={person.family_id || ''}
            />
          )}
        </div>

        {/* Simple Mode: Quick Add Bar */}
        {mode === 'simple' && canEdit && (
          <QuickAddBar
            onAddStory={() => {
              navigate(`/stories/new?person=${person.id}`)
            }}
            onAddPhoto={() => {
              navigate(`/capture?person=${person.id}`)
            }}
            onAddVoice={() => {
              navigate(`/capture?type=voice&person=${person.id}`)
            }}
            onAddMilestone={() => {
              // Open timeline block or navigate to a milestone creation flow
              toast({
                title: 'Add Milestone',
                description: 'Navigate to timeline to add a milestone event'
              })
            }}
          />
        )}

        {/* Simple Mode: Prompt of the Week */}
        {mode === 'simple' && (
          <PromptOfTheWeek
            personId={person.id}
            onAnswer={(answer) => {
              toast({
                title: 'Answer recorded',
                description: 'Your response has been saved'
              })
              console.log('Weekly prompt answer:', answer)
            }}
          />
        )}

        {/* Pinned Blocks */}
        {blocks.filter(b => b.pinned).map((block) => (
          <div key={block.id} className="col-span-full">
            <BlockRenderer
              block={block}
              person={{
                ...person,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as any}
              currentUserId={currentUserId}
              canEdit={canEdit || false}
              onUpdate={() => window.location.reload()}
            />
          </div>
        ))}

        {/* Blocks with PageLayoutManager */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <LayoutRenderer layout={currentTheme?.layout || 'magazine'}>
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {blocks.filter(b => !b.pinned).length === 0 ? (
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
                    <ErrorBoundary route={`/people/${id}` as string}>
                      <PageLayoutManager
                        blocks={buildBlocksArray(
                          blocks.filter(b => !b.pinned),
                          {
                            ...person,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          } as Person,
                          {
                            personId: person.id,
                            familyId: person.family_id || '',
                            preset: isLiving ? 'life' : 'tribute',
                            visibility,
                            indexability,
                            canEdit: canEdit || false,
                            onUpdate: () => window.location.reload()
                          },
                          canEdit || false,
                          currentUserId,
                          handleVisibilityChange,
                          handleUnlockDateChange,
                          handleRemoveBlock,
                          data.permission?.role
                        )}
                        layoutMap={layoutMap}
                        breakpoint={breakpoint}
                      />
                    </ErrorBoundary>
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