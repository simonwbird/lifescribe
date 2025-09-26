import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Plus, MoreHorizontal } from 'lucide-react'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Person {
  id: string
  full_name: string
  given_name: string
  surname: string | null
  avatar_url?: string
  birth_date?: string
  is_living: boolean
  account_status: 'joined' | 'invited' | 'not_on_app'
  member_role?: string
  stories_count: number
  media_count: number
}

interface CondensedPeopleTableProps {
  people: Person[]
  currentUserRole: string | null
  onInvite?: (person: Person) => void
  onCall?: (person: Person) => void
}

export function CondensedPeopleTable({ 
  people, 
  currentUserRole, 
  onInvite, 
  onCall 
}: CondensedPeopleTableProps) {
  const navigate = useNavigate()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'joined': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'invited': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'not_on_app': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'joined': return 'Active'
      case 'invited': return 'Invited'
      case 'not_on_app': return 'Not on app'
      default: return status
    }
  }

  // Desktop Table View
  const DesktopTable = () => (
    <div className="hidden md:block">
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="text-xs font-medium text-muted-foreground">
              <th className="text-left p-3 font-medium">Person</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Stories</th>
              <th className="text-left p-3 font-medium">Media</th>
              <th className="text-left p-3 font-medium">Age</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {people.map((person) => (
              <tr 
                key={person.id}
                className="group hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/people/${person.id}`)}
              >
                <td className="p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={person.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {person.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{person.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.member_role && (
                          <span className="capitalize">{person.member_role}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", getStatusColor(person.account_status))}
                  >
                    {formatStatus(person.account_status)}
                  </Badge>
                </td>
                <td className="p-3">
                  <span className="text-sm font-medium">{person.stories_count}</span>
                </td>
                <td className="p-3">
                  <span className="text-sm font-medium">{person.media_count}</span>
                </td>
                <td className="p-3">
                  <span className="text-sm text-muted-foreground">
                    {person.birth_date ? (
                      Math.floor((Date.now() - new Date(person.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                    ) : '—'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {person.account_status === 'joined' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCall?.(person)
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {person.account_status === 'not_on_app' && currentUserRole === 'admin' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          onInvite?.(person)
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/stories/new?person=${person.id}`)
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 p-0"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => navigate(`/people/${person.id}`)}
                        >
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate(`/people/${person.id}/timeline`)}
                        >
                          View Timeline
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate(`/stories/new?person=${person.id}`)}
                        >
                          Add Memory
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // Mobile Card View
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {people.map((person) => (
        <Card 
          key={person.id} 
          className="cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => navigate(`/people/${person.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={person.avatar_url} />
                  <AvatarFallback>
                    {person.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{person.full_name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getStatusColor(person.account_status))}
                    >
                      {formatStatus(person.account_status)}
                    </Badge>
                    {person.member_role && (
                      <span className="text-xs text-muted-foreground capitalize">
                        {person.member_role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <span>{person.stories_count} stories</span>
                    <span>{person.media_count} media</span>
                    {person.birth_date && (
                      <span>
                        Age {Math.floor((Date.now() - new Date(person.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {person.account_status === 'joined' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCall?.(person)
                    }}
                    className="h-8 px-2"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                )}
                
                {person.account_status === 'not_on_app' && currentUserRole === 'admin' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      onInvite?.(person)
                    }}
                    className="h-8 px-2"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Invite
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/stories/new?person=${person.id}`)
                  }}
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Memory
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <>
      <DesktopTable />
      <MobileCards />
    </>
  )
}