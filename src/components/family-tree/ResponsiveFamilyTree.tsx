import React, { useEffect, useRef, useState } from 'react'
import type { Person, Relationship } from '@/lib/familyTreeTypes'
import { LayoutEngine } from '@/lib/tree/LayoutEngine'
import { useIsMobile } from '@/hooks/use-mobile'

interface ResponsiveFamilyTreeProps {
  people: Person[]
  relationships: Relationship[]
  onPersonSelect: (personId: string) => void
  onViewProfile: (personId: string) => void
  onEditPerson: (personId: string) => void
  selectedPersonId?: string
}

export default function ResponsiveFamilyTree({
  people,
  relationships,
  onPersonSelect,
  onViewProfile,
  onEditPerson,
  selectedPersonId
}: ResponsiveFamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [layout, setLayout] = useState<any>(null)
  const isMobile = useIsMobile()
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        setDimensions({ width: clientWidth, height: clientHeight })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Generate layout and calculate scale
  useEffect(() => {
    if (!people.length || !dimensions.width) return

    // Use smaller default sizes for responsive layout
    const layoutEngine = new LayoutEngine(people, relationships, {
      cardWidth: 120,
      cardHeight: 140,
      hGap: 40,
      vGap: 100
    })
    
    const treeLayout = layoutEngine.generateLayout()
    setLayout(treeLayout)

    // Set initial zoom to 1.0 for responsive design
    setScale(1)
    setZoomLevel(1)
  }, [people, relationships, dimensions])

  // Organize people by generation for responsive layout
  const organizeByGeneration = () => {
    if (!layout) return []

    const generations: { [key: number]: Person[] } = {}
    
    // Group people by their generation (depth)
    layout.nodes.forEach((node: any) => {
      const person = people.find(p => p.id === node.personId)
      if (person) {
        if (!generations[node.depth]) generations[node.depth] = []
        generations[node.depth].push(person)
      }
    })

    return Object.entries(generations)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([generation, genPeople]) => ({
        generation: parseInt(generation),
        people: genPeople
      }))
  }

  const generationData = organizeByGeneration()

  // Zoom and pan handlers
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(Math.max(zoomLevel * delta, 0.3), 3)
      setZoomLevel(newZoom)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true)
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Reset zoom and pan
  const resetView = () => {
    setZoomLevel(scale)
    setPanOffset({ x: 0, y: 0 })
  }

  // Calculate responsive card size based on screen and content to fit everything
  const getResponsiveCardSize = () => {
    if (generationData.length === 0) return { width: 140, height: 160 }
    
    // Find the generation with the most people
    const maxPeopleInGeneration = Math.max(...generationData.map(g => g.people.length))
    
    // Calculate available width (minus padding and gaps)
    const containerPadding = isMobile ? 32 : dimensions.width < 1024 ? 48 : 64
    const availableWidth = dimensions.width - containerPadding
    
    // Calculate card width to fit all people in the widest generation
    const gapBetweenCards = isMobile ? 12 : dimensions.width < 1024 ? 16 : 24
    const totalGapWidth = (maxPeopleInGeneration - 1) * gapBetweenCards
    const maxCardWidth = (availableWidth - totalGapWidth) / maxPeopleInGeneration
    
    // Set minimum and maximum constraints
    const minCardWidth = isMobile ? 80 : 100
    const maxCardWidthLimit = isMobile ? 140 : dimensions.width < 1024 ? 150 : 180
    
    const cardWidth = Math.max(minCardWidth, Math.min(maxCardWidth, maxCardWidthLimit))
    const cardHeight = Math.max(120, cardWidth * 0.9) // Maintain aspect ratio
    
    return { 
      width: Math.floor(cardWidth), 
      height: Math.floor(cardHeight)
    }
  }

  const cardSize = getResponsiveCardSize()

  // Calculate if tree fits in viewport
  const doesTreeFitInViewport = () => {
    if (generationData.length === 0) return true
    const maxPeopleInGeneration = Math.max(...generationData.map(g => g.people.length))
    const gapBetweenCards = isMobile ? 12 : dimensions.width < 1024 ? 16 : 24
    const containerPadding = isMobile ? 32 : dimensions.width < 1024 ? 48 : 64
    const totalTreeWidth = (maxPeopleInGeneration * cardSize.width) + ((maxPeopleInGeneration - 1) * gapBetweenCards) + containerPadding
    return totalTreeWidth <= dimensions.width
  }

  const treeInfo = {
    totalPeople: people.length,
    generations: generationData.length,
    maxInGeneration: generationData.length > 0 ? Math.max(...generationData.map(g => g.people.length)) : 0,
    fitsInViewport: doesTreeFitInViewport()
  }

  if (!people.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No family members to display</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-gradient-to-br from-background via-muted/10 to-muted/20 relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoom Controls */}
      {!isMobile && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => setZoomLevel(Math.min(zoomLevel * 1.2, 3))}
            className="w-8 h-8 bg-background border rounded-md shadow-sm hover:bg-muted flex items-center justify-center text-sm font-bold"
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel(Math.max(zoomLevel * 0.8, 0.3))}
            className="w-8 h-8 bg-background border rounded-md shadow-sm hover:bg-muted flex items-center justify-center text-sm font-bold"
          >
            −
          </button>
          <button
            onClick={resetView}
            className="w-8 h-8 bg-background border rounded-md shadow-sm hover:bg-muted flex items-center justify-center text-xs"
            title="Reset view"
          >
            ⌂
          </button>
        </div>
      )}

      {/* Tree Content */}
      <div 
        className="w-full h-full p-4 md:p-6 lg:p-8 transition-transform origin-center overflow-hidden"
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Family Tree
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {treeInfo.totalPeople} family members across {treeInfo.generations} generations
          </p>
          {!treeInfo.fitsInViewport && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠ Tree optimized for {treeInfo.maxInGeneration} people per generation
            </p>
          )}
        </div>

        {/* Responsive Tree Layout */}
        <div className="space-y-6 md:space-y-8 lg:space-y-12">
          {generationData.map(({ generation, people: genPeople }) => (
            <div key={generation} className="relative">
              {/* Generation Label */}
              <div className="flex items-center justify-center mb-4">
                <div className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 md:px-4 md:py-2">
                  <span className="text-xs md:text-sm font-semibold text-primary">
                    Generation {generation}
                  </span>
                </div>
              </div>

              {/* People in this generation */}
              <div 
                className="flex flex-wrap justify-center gap-3 md:gap-4 lg:gap-6"
                style={{
                  gap: `${isMobile ? 12 : dimensions.width < 1024 ? 16 : 24}px`
                }}
              >
                {genPeople.map((person) => (
                  <div
                    key={person.id}
                    className={`
                      bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
                      ${selectedPersonId === person.id ? 'ring-2 ring-primary' : ''}
                      flex-shrink-0
                    `}
                    style={{
                      width: cardSize.width,
                      minHeight: cardSize.height
                    }}
                    onClick={() => onPersonSelect(person.id)}
                  >
                    {/* Avatar */}
                    <div className="flex items-center justify-center pt-3 md:pt-4">
                      <div 
                        className="bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold"
                        style={{
                          width: Math.min(48, cardSize.width * 0.35),
                          height: Math.min(48, cardSize.width * 0.35),
                          fontSize: Math.min(16, cardSize.width * 0.12)
                        }}
                      >
                        {person.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="text-center p-2 md:p-3">
                      <h3 
                        className="font-semibold text-foreground mb-1 leading-tight"
                        style={{ fontSize: Math.min(14, cardSize.width * 0.1) }}
                      >
                        {person.full_name}
                      </h3>
                      <div className="space-y-0.5">
                        {person.birth_year && (
                          <p 
                            className="text-muted-foreground"
                            style={{ fontSize: Math.min(12, cardSize.width * 0.08) }}
                          >
                            {person.birth_year}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-center gap-1 pb-2 md:pb-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewProfile(person.id)
                        }}
                        className="px-2 py-1 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors"
                        style={{ fontSize: Math.min(10, cardSize.width * 0.07) }}
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditPerson(person.id)
                        }}
                        className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs hover:bg-muted/80 transition-colors"
                        style={{ fontSize: Math.min(10, cardSize.width * 0.07) }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connection lines to next generation */}
              {generation < generationData.length - 1 && (
                <div className="flex justify-center mt-4 md:mt-6">
                  <div className="w-px h-6 md:h-8 bg-gradient-to-b from-border to-transparent"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 md:mt-12 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Responsive family tree • Optimized for {isMobile ? 'mobile' : dimensions.width < 1024 ? 'tablet' : 'desktop'}
            </p>
            <p className="text-xs text-muted-foreground">
              Card size: {cardSize.width}×{cardSize.height}px • Max per row: {treeInfo.maxInGeneration}
            </p>
            {zoomLevel !== 1 && (
              <p className="text-xs text-muted-foreground">
                Zoom: {Math.round(zoomLevel * 100)}%
              </p>
            )}
            {!isMobile && (
              <p className="text-xs text-muted-foreground">
                Scroll + Ctrl/Cmd to zoom • Drag to pan
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}