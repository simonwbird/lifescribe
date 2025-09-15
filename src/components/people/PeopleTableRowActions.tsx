import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  MoreHorizontal, 
  Edit, 
  Mail, 
  MessageSquare, 
  Camera, 
  ExternalLink, 
  Heart, 
  Trash2,
  Settings,
  Copy,
  RefreshCw,
  Monitor
} from 'lucide-react'
import type { Person } from '@/lib/familyTreeTypes'
import { derivePersonState, getActionLabel, canDeletePerson, type PersonAccounts, type CurrentUser } from '@/utils/personState'
import PersonEditModal from './modals/PersonEditModal'
import InviteManageModal from './modals/InviteManageModal'
import MemorializeModal from './MemorializeModal'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import UserModeManager from './UserModeManager'

interface PeopleTableRowActionsProps {
  person: Person & { 
    account_status?: string
    member_role?: string | null
    stories_count?: number
    photos_count?: number
  }
  personAccounts: PersonAccounts
  currentUser: CurrentUser
  familyId: string
  personUserLink?: {
    user_id: string
  } | null
  onPersonUpdated: () => void
}

export default function PeopleTableRowActions({ 
  person, 
  personAccounts, 
  currentUser, 
  familyId, 
  personUserLink,
  onPersonUpdated 
}: PeopleTableRowActionsProps) {
  const navigate = useNavigate()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showMemorializeModal, setShowMemorializeModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showModeManager, setShowModeManager] = useState(false)

  // Derive person state
  const personState = derivePersonState(person, personAccounts, currentUser)
  const deleteCheck = canDeletePerson(personState, person)

  // Action handlers
  const handleEditDetails = () => setShowEditModal(true)
  
  const handleInviteManage = () => setShowInviteModal(true)
  
  const handleRecordMemory = () => {
    const title = personState.isDeceased 
      ? `Memory of ${person.full_name}`
      : `Memory for ${person.full_name}`
    navigate(`/compose?personId=${person.id}&title=${encodeURIComponent(title)}`)
  }

  const handleAddPhoto = () => {
    // Navigate to media upload with person context
    navigate(`/media?personId=${person.id}&action=upload`)
  }

  const handleOpenPage = () => {
    navigate(`/people/${person.id}`)
  }

  const handleMemorialize = () => setShowMemorializeModal(true)

  const handleModeManager = () => setShowModeManager(true)

  const handleDelete = () => {
    if (deleteCheck.canDelete) {
      setShowDeleteDialog(true)
    }
  }

  // Get menu items based on person state
  const getMenuItems = () => {
    const items = []

    // Always show Edit details for admins/members
    if (personState.canAdmin || currentUser.role === 'member') {
      items.push({
        key: 'edit_details',
        label: getActionLabel('edit_details', person.full_name, personState.isDeceased),
        icon: <Edit className="h-4 w-4" />,
        onClick: handleEditDetails
      })
    }

    // Conditional invite/access management
    if (personState.canAdmin || currentUser.role === 'member') {
      switch (personState.displayStatus) {
        case 'living_not_on_app':
          items.push({
            key: 'invite_manage',
            label: getActionLabel('invite_manage', person.full_name, personState.isDeceased),
            icon: <Mail className="h-4 w-4" />,
            onClick: handleInviteManage
          })
          break
        case 'living_invited':
          items.push({
            key: 'manage_invite',
            label: getActionLabel('manage_invite', person.full_name, personState.isDeceased),
            icon: <Settings className="h-4 w-4" />,
            onClick: handleInviteManage
          })
          break
        case 'living_joined':
          items.push({
            key: 'manage_access',
            label: getActionLabel('manage_access', person.full_name, personState.isDeceased),
            icon: <Settings className="h-4 w-4" />,
            onClick: handleInviteManage
          })
          
          // Add mode management for admins when person has a user account
          if (currentUser.role === 'admin' && personUserLink?.user_id) {
            items.push({
              key: 'manage_mode',
              label: 'Manage Mode',
              icon: <Monitor className="h-4 w-4" />,
              onClick: handleModeManager
            })
          }
          break
      }
    }

    // Always show record memory and add photo
    items.push({
      key: 'record_memory',
      label: getActionLabel('record_memory', person.full_name, personState.isDeceased),
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: handleRecordMemory
    })

    items.push({
      key: 'add_photo',
      label: getActionLabel('add_photo', person.full_name, personState.isDeceased),
      icon: <Camera className="h-4 w-4" />,
      onClick: handleAddPhoto
    })

    // Always show open page
    items.push({
      key: 'open_page',
      label: getActionLabel('open_page', person.full_name, personState.isDeceased),
      icon: <ExternalLink className="h-4 w-4" />,
      onClick: handleOpenPage
    })

    // Memorialize/revert for admins/members
    if (personState.canAdmin || currentUser.role === 'member') {
      if (personState.displayStatus === 'deceased') {
        items.push({
          key: 'revert_memorialize',
          label: getActionLabel('revert_memorialize', person.full_name, personState.isDeceased),
          icon: <Heart className="h-4 w-4" />,
          onClick: handleMemorialize
        })
      } else {
        items.push({
          key: 'memorialize',
          label: getActionLabel('memorialize', person.full_name, personState.isDeceased),
          icon: <Heart className="h-4 w-4" />,
          onClick: handleMemorialize
        })
      }
    }

    // Delete for admins only
    if (personState.canAdmin) {
      items.push({ key: 'separator' })
      items.push({
        key: 'delete',
        label: getActionLabel('delete', person.full_name, personState.isDeceased),
        icon: <Trash2 className="h-4 w-4" />,
        onClick: handleDelete,
        disabled: !deleteCheck.canDelete,
        tooltip: deleteCheck.reason,
        variant: 'destructive' as const
      })
    }

    return items
  }

  const menuItems = getMenuItems()

  // If user is guest, only show open page
  if (currentUser.role === 'guest') {
    return (
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleOpenPage}
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {menuItems.map((item, index) => {
            if (item.key === 'separator') {
              return <DropdownMenuSeparator key={`separator-${index}`} />
            }

            const menuItem = (
              <DropdownMenuItem
                key={item.key}
                onClick={item.onClick}
                disabled={item.disabled}
                className={item.variant === 'destructive' ? 'text-destructive' : ''}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              </DropdownMenuItem>
            )

            if (item.tooltip && item.disabled) {
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>
                    {menuItem}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return menuItem
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      {showEditModal && (
        <PersonEditModal
          person={person}
          familyId={familyId}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            onPersonUpdated()
          }}
        />
      )}

      {showInviteModal && (
        <InviteManageModal
          person={person}
          familyId={familyId}
          currentStatus={personState.displayStatus}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
            onPersonUpdated()
          }}
        />
      )}

      {showMemorializeModal && (
        <MemorializeModal
          person={person}
          onClose={() => setShowMemorializeModal(false)}
          onSuccess={() => {
            setShowMemorializeModal(false)
            onPersonUpdated()
          }}
        />
      )}

      {showDeleteDialog && (
        <DeleteConfirmDialog
          person={person}
          onClose={() => setShowDeleteDialog(false)}
          onSuccess={() => {
            setShowDeleteDialog(false)
            onPersonUpdated()
          }}
        />
      )}

      {showModeManager && (
        <UserModeManager
          person={person}
          personUserLink={personUserLink}
          open={showModeManager}
          onOpenChange={setShowModeManager}
          onSuccess={() => {
            onPersonUpdated()
          }}
        />
      )}
    </TooltipProvider>
  )
}