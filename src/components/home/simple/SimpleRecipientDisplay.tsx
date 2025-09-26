import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Mail, 
  Settings, 
  Shield, 
  UserPlus, 
  Crown,
  User
} from 'lucide-react'

interface SimpleRecipientDisplayProps {
  recipients: string[] | { all: boolean; exclude: string[] }
  familyMembers?: Array<{
    id: string
    full_name: string
    avatar_url?: string
    role?: string
  }>
  onManage: () => void
  className?: string
}

export default function SimpleRecipientDisplay({ 
  recipients, 
  familyMembers = [], 
  onManage, 
  className 
}: SimpleRecipientDisplayProps) {
  
  const getRecipientInfo = () => {
    if (Array.isArray(recipients)) {
      const emailRecipients = recipients.filter(r => r.includes('@'))
      const memberRecipients = familyMembers.filter(m => 
        recipients.some(r => r.includes(m.full_name) || r === m.id)
      )
      
      return {
        type: 'specific' as const,
        count: recipients.length,
        members: memberRecipients,
        emails: emailRecipients
      }
    } else if (recipients.all) {
      return {
        type: 'all' as const,
        count: Math.max(familyMembers.length, 1),
        members: familyMembers.filter(m => 
          !recipients.exclude.includes(m.id) && !recipients.exclude.includes(m.full_name)
        ),
        excluded: recipients.exclude.length
      }
    }
    
    return {
      type: 'none' as const,
      count: 0,
      members: [],
      emails: []
    }
  }

  const recipientInfo = getRecipientInfo()
  
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-amber-500" />
      case 'moderator':
        return <Shield className="h-3 w-3 text-blue-500" />
      default:
        return <User className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Admin</Badge>
      case 'moderator':  
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Moderator</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Member</Badge>
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Digest Recipients</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onManage}
            className="h-7 text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            Manage
          </Button>
        </div>

        {/* Count Summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold">{recipientInfo.count}</div>
              <div className="text-xs text-muted-foreground">
                {recipientInfo.type === 'all' ? 'All family' : 'Recipients'}
              </div>
            </div>
          </div>
          
          {recipientInfo.type === 'all' && recipientInfo.excluded > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recipientInfo.excluded} excluded
            </Badge>
          )}
        </div>

        {/* Recipients List */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Who Gets the Digest
          </h4>
          
          <div className="space-y-2">
            {recipientInfo.type === 'none' ? (
              <div className="text-center py-3 border-2 border-dashed rounded-lg">
                <UserPlus className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">No recipients added yet</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onManage}
                  className="text-xs mt-1"
                >
                  Add Recipients
                </Button>
              </div>
            ) : (
              <>
                {/* Family Members */}
                {recipientInfo.members.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {member.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{member.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      {getRoleBadge(member.role)}
                    </div>
                  </div>
                ))}
                
                {/* External Email Recipients */}
                {'emails' in recipientInfo && recipientInfo.emails.map((email, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-lg bg-green-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                        <Mail className="h-3 w-3 text-green-700" />
                      </div>
                      <span className="text-sm font-medium">{email}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      External
                    </Badge>
                  </div>
                ))}
                
                {recipientInfo.type === 'all' && (
                  <div className="text-center py-2">
                    <Badge variant="secondary" className="text-xs">
                      Sending to all family members
                    </Badge>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-3 border-t text-center">
          <p className="text-xs text-muted-foreground">
            {recipientInfo.type === 'all' 
              ? 'Automatically includes new family members'
              : `Digest will be sent to ${recipientInfo.count} recipient${recipientInfo.count !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}