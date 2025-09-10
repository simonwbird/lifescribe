import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  Undo2, 
  Redo2, 
  HelpCircle,
  Settings,
  Save,
  Users
} from 'lucide-react'
import FamilyTreeCanvas from './FamilyTreeCanvas'
import FamilyTreeTutorial from './FamilyTreeTutorial'
import { useToast } from '@/hooks/use-toast'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface DragDropFamilyTreeProps {
  people: Person[]
  relationships: Relationship[]
  familyId: string
  onPersonMove: (personId: string, x: number, y: number) => void
  onAddPerson: () => void
  onViewProfile: (personId: string) => void
  onEditPerson: (personId: string) => void
  onAddRelation: (fromPersonId: string, toPersonId: string, type: 'parent' | 'child' | 'spouse') => void
  positions: Record<string, { x: number; y: number }>
  onSaveLayout: () => void
  isFirstTime?: boolean
}

interface HistoryState {
  positions: Record<string, { x: number; y: number }>
  timestamp: number
}

export default function DragDropFamilyTree({
  people,
  relationships,
  familyId,
  onPersonMove,
  onAddPerson,
  onViewProfile,
  onEditPerson,
  onAddRelation,
  positions,
  onSaveLayout,
  isFirstTime = false
}: DragDropFamilyTreeProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string>()
  const [showTutorial, setShowTutorial] = useState(isFirstTime)
  const [history, setHistory] = useState<HistoryState[]>([{ positions, timestamp: Date.now() }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { toast } = useToast()

  // Auto-save timer
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        handleSave()
      }, 10000) // Auto-save after 10 seconds of inactivity

      return () => clearTimeout(timer)
    }
  }, [hasUnsavedChanges, positions])

  // Add to history when positions change
  const addToHistory = useCallback((newPositions: Record<string, { x: number; y: number }>) => {
    const newState = { positions: newPositions, timestamp: Date.now() }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newState)
    
    // Keep only last 20 states
    if (newHistory.length > 20) {
      newHistory.shift()
    }
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setHasUnsavedChanges(true)
  }, [history, historyIndex])

  const handlePersonMove = useCallback((personId: string, x: number, y: number) => {
    onPersonMove(personId, x, y)
    
    // Debounced history addition
    setTimeout(() => {
      addToHistory({ ...positions, [personId]: { x, y } })
    }, 500)
  }, [onPersonMove, positions, addToHistory])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const state = history[newIndex]
      
      Object.entries(state.positions).forEach(([personId, pos]) => {
        onPersonMove(personId, pos.x, pos.y)
      })
      
      setHistoryIndex(newIndex)
      setHasUnsavedChanges(true)
      
      toast({
        title: "Undone",
        description: "Restored previous layout"
      })
    }
  }, [history, historyIndex, onPersonMove, toast])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const state = history[newIndex]
      
      Object.entries(state.positions).forEach(([personId, pos]) => {
        onPersonMove(personId, pos.x, pos.y)
      })
      
      setHistoryIndex(newIndex)
      setHasUnsavedChanges(true)
      
      toast({
        title: "Redone",
        description: "Restored next layout"
      })
    }
  }, [history, historyIndex, onPersonMove, toast])

  const handleSave = useCallback(() => {
    onSaveLayout()
    setHasUnsavedChanges(false)
    toast({
      title: "Layout Saved",
      description: "Your family tree layout has been saved"
    })
  }, [onSaveLayout, toast])

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false)
    localStorage.setItem('familyTree.tutorialCompleted', 'true')
    
    toast({
      title: "Tutorial Complete!",
      description: "You're ready to organize your family tree",
      duration: 3000
    })
  }, [toast])

  const getTreeStats = () => {
    const generations = new Set<number>()
    const connections = relationships.length
    
    // Simple generation calculation
    people.forEach((_, index) => {
      generations.add(Math.floor(index / 3))
    })

    return {
      people: people.length,
      connections,
      generations: generations.size
    }
  }

  const stats = getTreeStats()

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Top Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-30">
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              {/* Left: Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={onAddPerson}
                  className="flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Person
                </Button>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant={hasUnsavedChanges ? "default" : "outline"}
                  size="sm"
                  onClick={handleSave}
                  className={hasUnsavedChanges ? "animate-pulse" : ""}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {hasUnsavedChanges ? "Save Changes" : "Saved"}
                </Button>
              </div>

              {/* Center: Stats */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{stats.people} people</span>
                </div>
                
                <Badge variant="secondary" className="text-xs">
                  {stats.connections} connections
                </Badge>
                
                <Badge variant="outline" className="text-xs">
                  {stats.generations} generations
                </Badge>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTutorial(true)}
                  title="Show Tutorial"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  title="Tree Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Canvas */}
      <div className="absolute inset-0 pt-20">
        <FamilyTreeCanvas
          people={people}
          relationships={relationships}
          positions={positions}
          selectedPersonId={selectedPersonId}
          onPersonMove={handlePersonMove}
          onPersonSelect={setSelectedPersonId}
          onAddRelation={onAddRelation}
          onViewProfile={onViewProfile}
          onEditPerson={onEditPerson}
        />
      </div>

      {/* Tutorial Overlay */}
      <FamilyTreeTutorial
        isVisible={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={handleTutorialComplete}
      />

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4">
        <Card className="bg-white/90 backdrop-blur-sm border shadow-sm">
          <CardContent className="p-2 px-3">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              
              <div>
                {selectedPersonId ? (
                  <span>Selected: {people.find(p => p.id === selectedPersonId)?.full_name || 'Unknown'}</span>
                ) : (
                  <span>Click a person to select • Drag to move • Hover for connections</span>
                )}
              </div>
              
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs animate-pulse">
                  Unsaved changes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts Helper */}
      <div className="absolute bottom-4 right-20 opacity-0 hover:opacity-100 transition-opacity">
        <Card className="bg-black/80 text-white text-xs">
          <CardContent className="p-2 space-y-1">
            <div><kbd className="bg-white/20 px-1 rounded">Ctrl+Z</kbd> Undo</div>
            <div><kbd className="bg-white/20 px-1 rounded">Ctrl+Y</kbd> Redo</div>
            <div><kbd className="bg-white/20 px-1 rounded">Ctrl+S</kbd> Save</div>
            <div><kbd className="bg-white/20 px-1 rounded">Space</kbd> Pan mode</div>
            <div><kbd className="bg-white/20 px-1 rounded">Wheel</kbd> Zoom</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
