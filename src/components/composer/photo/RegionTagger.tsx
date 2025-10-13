import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { X, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Region {
  id: string
  x: number
  y: number
  width: number
  height: number
  person_id?: string
  role: string
  label?: string
  person?: { id: string; full_name: string }
}

interface RegionTaggerProps {
  imageUrl: string
  assetId: string
  familyId: string
  isTagMode: boolean
  zoom: number
}

export function RegionTagger({ imageUrl, assetId, familyId, isTagMode, zoom }: RegionTaggerProps) {
  const [regions, setRegions] = useState<Region[]>([])
  const [people, setPeople] = useState<Array<{ id: string; full_name: string }>>([])
  const [drawingRegion, setDrawingRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [showPopover, setShowPopover] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchRegions()
    fetchPeople()
  }, [assetId])

  async function fetchRegions() {
    const { data, error } = await supabase
      .from('photo_regions')
      .select('*, person:people(id, full_name)')
      .eq('asset_id', assetId)

    if (error) {
      console.error('Error fetching regions:', error)
      return
    }

    setRegions(data || [])
  }

  async function fetchPeople() {
    const { data, error } = await supabase
      .from('people')
      .select('id, full_name')
      .eq('family_id', familyId)
      .order('full_name')

    if (error) {
      console.error('Error fetching people:', error)
      return
    }

    setPeople(data || [])
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!isTagMode || !imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    
    setDrawingRegion({ x, y, width: 0, height: 0 })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!drawingRegion || !imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const currentX = (e.clientX - rect.left) / rect.width
    const currentY = (e.clientY - rect.top) / rect.height
    
    setDrawingRegion({
      x: Math.min(drawingRegion.x, currentX),
      y: Math.min(drawingRegion.y, currentY),
      width: Math.abs(currentX - drawingRegion.x),
      height: Math.abs(currentY - drawingRegion.y)
    })
  }

  function handleMouseUp() {
    if (!drawingRegion) return
    
    if (drawingRegion.width > 0.02 && drawingRegion.height > 0.02) {
      setSelectedRegion({
        id: 'temp-' + Date.now(),
        ...drawingRegion,
        role: 'appears',
      })
      setShowPopover(true)
    }
    
    setDrawingRegion(null)
  }

  async function saveRegion(personId?: string, role: string = 'appears', label?: string) {
    if (!selectedRegion) return

    const { data, error } = await supabase
      .from('photo_regions')
      .insert({
        asset_id: assetId,
        x: selectedRegion.x,
        y: selectedRegion.y,
        width: selectedRegion.width,
        height: selectedRegion.height,
        person_id: personId,
        role,
        label,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select('*, person:people(id, full_name)')
      .single()

    if (error) {
      toast({ title: 'Error saving region', description: error.message, variant: 'destructive' })
      return
    }

    setRegions([...regions, data])
    setSelectedRegion(null)
    setShowPopover(false)
    toast({ title: 'Region saved' })
  }

  async function deleteRegion(regionId: string) {
    const { error } = await supabase
      .from('photo_regions')
      .delete()
      .eq('id', regionId)

    if (error) {
      toast({ title: 'Error deleting region', description: error.message, variant: 'destructive' })
      return
    }

    setRegions(regions.filter(r => r.id !== regionId))
    toast({ title: 'Region deleted' })
  }

  async function addNewPerson() {
    if (!newPersonName.trim()) return

    const { data, error } = await supabase
      .from('people')
      .insert({
        family_id: familyId,
        full_name: newPersonName.trim()
      })
      .select()
      .single()

    if (error) {
      toast({ title: 'Error adding person', description: error.message, variant: 'destructive' })
      return
    }

    setPeople([...people, data])
    setNewPersonName('')
    return data.id
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Photo for tagging"
        className="max-w-full max-h-full object-contain"
      />

      {/* Existing regions */}
      {regions.map(region => (
        <div
          key={region.id}
          className="absolute border-2 border-primary bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors"
          style={{
            left: `${region.x * 100}%`,
            top: `${region.y * 100}%`,
            width: `${region.width * 100}%`,
            height: `${region.height * 100}%`
          }}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedRegion(region)
          }}
        >
          <div className="absolute -top-6 left-0 bg-primary text-primary-foreground px-2 py-1 text-xs rounded">
            {region.person?.full_name || region.label || 'Tagged'}
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              deleteRegion(region.id)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* Drawing region */}
      {drawingRegion && (
        <div
          className="absolute border-2 border-dashed border-primary bg-primary/10"
          style={{
            left: `${drawingRegion.x * 100}%`,
            top: `${drawingRegion.y * 100}%`,
            width: `${drawingRegion.width * 100}%`,
            height: `${drawingRegion.height * 100}%`
          }}
        />
      )}

      {/* Region popover */}
      {showPopover && selectedRegion && (
        <Popover open={showPopover} onOpenChange={setShowPopover}>
          <PopoverTrigger asChild>
            <div
              className="absolute"
              style={{
                left: `${selectedRegion.x * 100}%`,
                top: `${(selectedRegion.y + selectedRegion.height) * 100}%`
              }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label>Person</Label>
                <Command>
                  <CommandInput placeholder="Search people..." />
                  <CommandEmpty>
                    <div className="p-2">
                      <Input
                        placeholder="New person name..."
                        value={newPersonName}
                        onChange={(e) => setNewPersonName(e.target.value)}
                        className="mb-2"
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const personId = await addNewPerson()
                          if (personId) await saveRegion(personId, 'appears')
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Person
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {people.map(person => (
                      <CommandItem
                        key={person.id}
                        onSelect={() => saveRegion(person.id, 'appears')}
                      >
                        {person.full_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </div>

              <div>
                <Label>Or Label (for objects)</Label>
                <Input
                  placeholder="e.g., Grandad's Austin Mini"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      saveRegion(undefined, 'appears', e.currentTarget.value)
                    }
                  }}
                />
              </div>

              <div>
                <Label>Role</Label>
                <Select defaultValue="appears" onValueChange={(role) => {
                  if (selectedRegion.person_id) {
                    saveRegion(selectedRegion.person_id, role)
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subject">Subject</SelectItem>
                    <SelectItem value="appears">Appears</SelectItem>
                    <SelectItem value="mentioned">Mentioned</SelectItem>
                    <SelectItem value="photographer">Photographer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedRegion(null)
                  setShowPopover(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
