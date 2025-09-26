import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  EyeOff, 
  Calendar, 
  MessageSquare, 
  Image, 
  Heart, 
  Gift, 
  Mail,
  Clock,
  Users
} from 'lucide-react'
import { DigestPreview } from '@/lib/digestTypes'

interface SimpleDigestPreviewProps {
  preview: DigestPreview
  isOpen: boolean
  onClose: () => void
  familyName: string
}

export const SimpleDigestPreview = ({ preview, isOpen, onClose, familyName }: SimpleDigestPreviewProps) => {
  const [showSensitive, setShowSensitive] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getContentSummary = () => {
    const totalItems = preview.stories + preview.photos + preview.comments + preview.birthdays
    return {
      totalItems,
      hasContent: totalItems > 0
    }
  }

  const { totalItems, hasContent } = getContentSummary()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl">Weekly Digest Preview</DialogTitle>
          <p className="text-sm text-muted-foreground">
            This is exactly what your family will receive by email
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Header Simulation */}
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
            <CardHeader className="text-center pb-3">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-blue-900">
                  📧 {familyName} Weekly Digest
                </h2>
                <p className="text-sm text-blue-700">
                  Week of {formatDate(preview.preview_date)}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                  <Clock className="h-3 w-3" />
                  <span>Delivered every Sunday at 9 AM</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Content Summary with Large Numbers */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-center text-sm font-semibold mb-3 text-muted-foreground">
                This Week's Family Activity
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{preview.stories}</div>
                  <div className="text-xs text-blue-600 flex items-center justify-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Stories
                  </div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{preview.photos}</div>
                  <div className="text-xs text-green-600 flex items-center justify-center gap-1">
                    <Image className="h-3 w-3" />
                    Photos
                  </div>
                </div>
                
                <div className="text-center p-3 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{preview.comments}</div>
                  <div className="text-xs text-pink-600 flex items-center justify-center gap-1">
                    <Heart className="h-3 w-3" />
                    Comments
                  </div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{preview.birthdays}</div>
                  <div className="text-xs text-purple-600 flex items-center justify-center gap-1">
                    <Gift className="h-3 w-3" />
                    Birthdays
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Content Preview</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSensitive(!showSensitive)}
                  className="h-7 px-3 text-xs"
                >
                  {showSensitive ? (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              </div>

              {/* Sample Email Content */}
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                {hasContent ? (
                  <>
                    {preview.stories > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          Recent Stories
                        </h4>
                        <div className="space-y-1 ml-6">
                          {Array.from({ length: Math.min(preview.stories, 2) }, (_, i) => (
                            <div key={i} className={`text-xs ${showSensitive ? '' : 'blur-sm'} transition-all duration-200`}>
                              • "A wonderful day at the park with the kids..."
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {preview.birthdays > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-600" />
                          Upcoming Celebrations
                        </h4>
                        <div className="space-y-1 ml-6">
                          <div className={`text-xs ${showSensitive ? '' : 'blur-sm'} transition-all duration-200`}>
                            🎂 Sarah's birthday is this Thursday!
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No new content this week. The digest will include a gentle reminder to share memories.
                    </p>
                  </div>
                )}
                
                <div className="text-center pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    📱 <strong>View in app →</strong> | 📧 <strong>Forward to family</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unlock Status */}
          {!preview.is_unlocked && (
            <div className="p-3 border border-amber-200 rounded-lg bg-amber-50">
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800">
                    Preview Mode
                  </p>
                  <p className="text-xs text-amber-700">
                    This digest is currently locked. Invite more family members to unlock weekly emails with your real content.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generation Info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Preview generated {new Date(preview.generated_at).toLocaleString()}
            </p>
          </div>

          {/* Action Button */}
          <Button onClick={onClose} className="w-full">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}