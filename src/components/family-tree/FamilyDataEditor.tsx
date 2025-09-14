import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PeopleTable } from './PeopleTable'
import { RelationshipsTable } from './RelationshipsTable'
import { FamilyDataService, PersonData, RelationshipData } from '@/lib/familyDataService'
import { supabase } from '@/integrations/supabase/client'
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

  // Real-time listeners for people changes
  useEffect(() => {
    if (!open || !familyId) return

    const peopleChannel = supabase
      .channel('people-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'people',
          filter: `family_id=eq.${familyId}`
        },
        (payload) => {
          console.log('People change detected:', payload)
          // Reload people data when any change occurs
          FamilyDataService.getPeople(familyId).then(setPeople).catch(console.error)
          // Also notify parent component
          onDataChange?.()
        }
      )
      .subscribe()

    const relationshipsChannel = supabase
      .channel('relationships-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'relationships',
          filter: `family_id=eq.${familyId}`
        },
        (payload) => {
          console.log('Relationships change detected:', payload)
          // Reload relationships data when any change occurs
          FamilyDataService.getRelationships(familyId).then(setRelationships).catch(console.error)
          // Also notify parent component
          onDataChange?.()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(peopleChannel)
      supabase.removeChannel(relationshipsChannel)
    }
  }, [open, familyId, onDataChange])

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
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Family Data</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="people" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="people">People ({people.length})</TabsTrigger>
              <TabsTrigger value="relationships">Relationships ({relationships.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="people" className="flex-1 overflow-auto mt-4 pr-2">
              <PeopleTable 
                people={people} 
                familyId={familyId} 
                onUpdate={handleDataUpdate}
              />
            </TabsContent>
            
            <TabsContent value="relationships" className="flex-1 overflow-auto mt-4 pr-2">
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