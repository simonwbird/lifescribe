import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Heart, 
  Camera, 
  Mic, 
  UserPlus, 
  Settings, 
  Plus,
  MessageSquare 
} from 'lucide-react'
import { Person, UserRole, getAgeLabel, canEdit, canAddContent } from '@/utils/personUtils'
import PersonForm from './PersonForm'
import MemorializeModal from './MemorializeModal'
import { useNavigate } from 'react-router-dom'

interface LifePageHeaderProps {
  person: Person
  userRole: UserRole
  pageType: 'life' | 'tribute'
  onPersonUpdated: () => void
}

export function LifePageHeader({ person, userRole, pageType, onPersonUpdated }: LifePageHeaderProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showMemorialDialog, setShowMemorialDialog] = useState(false)
  const navigate = useNavigate()
  
  const ageLabel = getAgeLabel(person)
  const isMemorialized = pageType === 'tribute'
  const canUserEdit = canEdit(userRole)
  const canUserAddContent = canAddContent(userRole)

  const handleRecordMemory = () => {
    const title = isMemorialized 
      ? `Memory of ${person.given_name || person.full_name}`
      : `Memory for ${person.given_name || person.full_name}`
    
    navigate(`/stories/new?personId=${person.id}&title=${encodeURIComponent(title)}`)
  }

  const handleAddPhoto = () => {
    navigate(`/stories/new?personId=${person.id}&mode=photo`)
  }

  const handleInviteToClaim = () => {
    // TODO: Implement invite to claim functionality
    console.log('Invite to claim:', person.id)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Title and Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                {person.full_name} — {isMemorialized ? 'Tribute Page' : 'Life Page'}
              </h1>
              {isMemorialized && (
                <Badge variant="secondary" className="text-sm">
                  <Heart className="h-3 w-3 mr-1" />
                  In memoriam
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {ageLabel && (
                <Badge variant="outline">{ageLabel}</Badge>
              )}
              {/* TODO: Add relation-to-me chip when relationships are implemented */}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {canUserAddContent && (
              <>
                <Button onClick={handleRecordMemory} className="gap-2">
                  <Mic className="h-4 w-4" />
                  {isMemorialized ? `Record memory of ${person.given_name}` : `Record memory for ${person.given_name}`}
                </Button>
                
                <Button variant="outline" onClick={handleAddPhoto} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Add photo
                </Button>
                
                {!isMemorialized && !person.claimed_by_profile_id && (
                  <Button variant="outline" onClick={handleInviteToClaim} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite to claim
                  </Button>
                )}
                
                {isMemorialized && (
                  <Button variant="outline" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Leave tribute
                  </Button>
                )}
              </>
            )}

            {canUserEdit && (
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Edit {person.full_name}</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-y-auto flex-1 pr-2">
                    <PersonForm
                      person={person}
                      familyId={person.family_id}
                      onSuccess={() => {
                        setShowEditDialog(false)
                        onPersonUpdated()
                      }}
                      onCancel={() => setShowEditDialog(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {canUserEdit && isMemorialized && (
              <>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setShowMemorialDialog(true)}
                >
                  <Heart className="h-4 w-4" />
                  Revert memorialization
                </Button>

                {showMemorialDialog && (
                  <MemorializeModal
                    person={person}
                    onClose={() => setShowMemorialDialog(false)}
                    onSuccess={() => {
                      setShowMemorialDialog(false)
                      onPersonUpdated()
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}