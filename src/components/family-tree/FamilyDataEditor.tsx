import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PeopleTable } from './PeopleTable'
import { RelationshipsTable } from './RelationshipsTable'
import { FamilyDataService, PersonData, RelationshipData } from '@/lib/familyDataService'
import { toast } from 'sonner'

interface FamilyDataEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  onDataChange?: () => void
}

export function FamilyDataEditor({ open, onOpenChange, familyId, onDataChange }: FamilyDataEditorProps) {
  const [people, setPeople] = useState<PersonData[]>([])
  const [relationships, setRelationships] = useState<RelationshipData[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    if (!familyId) return
    
    setLoading(true)
    try {
      const [peopleData, relationshipsData] = await Promise.all([
        FamilyDataService.getPeople(familyId),
        FamilyDataService.getRelationships(familyId)
      ])
      
      setPeople(peopleData)
      setRelationships(relationshipsData)
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && familyId) {
      loadData()
    }
  }, [open, familyId])

  const handleDataUpdate = () => {
    loadData()
    onDataChange?.()
  }

  const handleClose = () => {
    onOpenChange(false)
    // Trigger a refresh of the family tree when closing
    onDataChange?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Family Data</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="people" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
            </TabsList>
            
            <TabsContent value="people" className="flex-1 overflow-auto">
              <PeopleTable 
                people={people} 
                familyId={familyId} 
                onUpdate={handleDataUpdate}
              />
            </TabsContent>
            
            <TabsContent value="relationships" className="flex-1 overflow-auto">
              <RelationshipsTable 
                relationships={relationships} 
                people={people}
                familyId={familyId} 
                onUpdate={handleDataUpdate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}