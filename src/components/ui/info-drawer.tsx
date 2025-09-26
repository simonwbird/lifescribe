import { useState } from 'react'
import { ChevronDown, ChevronRight, Shield, Download, Trash2, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface InfoDrawerProps {
  title: string
  type: 'encryption' | 'export' | 'privacy' | 'security'
  className?: string
}

export function InfoDrawer({ title, type, className }: InfoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getIcon = () => {
    switch (type) {
      case 'encryption': return <Key className="h-4 w-4 text-green-600" />
      case 'export': return <Download className="h-4 w-4 text-blue-600" />
      case 'privacy': return <Shield className="h-4 w-4 text-green-600" />
      case 'security': return <Shield className="h-4 w-4 text-orange-600" />
    }
  }

  const getContent = () => {
    switch (type) {
      case 'encryption':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                AES-256 Encryption
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              All your family memories are protected with military-grade encryption. Even we can't access your content without your permission.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Your content is encrypted before leaving your device</li>
              <li>• Encryption keys are stored securely and never shared</li>
              <li>• Photos, videos, and text are all fully protected</li>
            </ul>
          </div>
        )
      case 'export':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You own your memories. Export everything anytime in standard formats that work everywhere.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs">
                <strong>Stories:</strong> PDF, Word, TXT
              </div>
              <div className="text-xs">
                <strong>Photos:</strong> Original JPG/PNG
              </div>
              <div className="text-xs">
                <strong>Videos:</strong> Original MP4/MOV
              </div>
              <div className="text-xs">
                <strong>Audio:</strong> Original MP3/WAV
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Start Export
            </Button>
          </div>
        )
      case 'privacy':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your family space is completely private. Only people you invite can see your memories.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• No public profiles or searchable content</li>
              <li>• Invitation-only family spaces</li>
              <li>• No advertising or data mining</li>
              <li>• Optional two-factor authentication</li>
            </ul>
          </div>
        )
      case 'security':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Multiple layers of security protect your family's digital legacy.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Account Security</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Strong</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Two-Factor Auth</span>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-blue-600">
                  Enable
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Data Backups</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <Card className={cn("border-l-4 border-l-primary/20", className)}>
      <CardContent className="p-3">
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between h-auto p-2 font-normal"
        >
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="text-sm font-medium">{title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        
        {isOpen && (
          <div className="mt-3 pl-6">
            {getContent()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}