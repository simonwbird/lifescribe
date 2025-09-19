import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Calendar, Users, MessageSquare, Heart, Gift, Star } from 'lucide-react'
import { DigestPreview } from '@/lib/digestTypes'
import { useState } from 'react'

interface DigestPreviewModalProps {
  preview: DigestPreview
  isOpen: boolean
  onClose: () => void
  familyName: string
}

export const DigestPreviewModal = ({ preview, isOpen, onClose, familyName }: DigestPreviewModalProps) => {
  const [showSensitive, setShowSensitive] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getContentItems = () => [
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Stories',
      count: preview.stories,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      icon: <Eye className="h-4 w-4" />,
      label: 'Photos',
      count: preview.photos,
      color: 'bg-green-100 text-green-800'
    },
    {
      icon: <Heart className="h-4 w-4" />,
      label: 'Comments',
      count: preview.comments,
      color: 'bg-pink-100 text-pink-800'
    },
    {
      icon: <Gift className="h-4 w-4" />,
      label: 'Birthdays',
      count: preview.birthdays,
      color: 'bg-purple-100 text-purple-800'
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Digest Preview - {familyName}
          </DialogTitle>
          <DialogDescription>
            Preview of next weekly digest • Generated {formatDate(preview.generated_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Week's Activity</CardTitle>
              <CardDescription>
                Content that will be included in the digest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {getContentItems().map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <Badge variant="secondary" className={item.color}>
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {showSensitive ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                Content Preview
              </CardTitle>
              <CardDescription>
                Sample content from the digest with privacy protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Show sensitive content</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSensitive(!showSensitive)}
                  >
                    {showSensitive ? 'Hide' : 'Show'}
                  </Button>
                </div>

                {/* Mock Digest Content */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-2">{familyName} Weekly Digest</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Week of {formatDate(preview.preview_date)}
                    </p>
                  </div>

                  {/* Stories Section */}
                  {preview.stories > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        New Stories ({preview.stories})
                      </h4>
                      <div className="space-y-2 pl-6">
                        {Array.from({ length: Math.min(preview.stories, 3) }, (_, i) => (
                          <div key={i} className="text-sm">
                            <div className={`${showSensitive ? '' : 'blur-sm'} transition-all duration-200`}>
                              • Sample story title about family memories #{i + 1}
                            </div>
                          </div>
                        ))}
                        {preview.stories > 3 && (
                          <div className="text-sm text-muted-foreground">
                            + {preview.stories - 3} more stories
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Photos Section */}
                  {preview.photos > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        New Photos ({preview.photos})
                      </h4>
                      <div className="grid grid-cols-3 gap-2 pl-6">
                        {Array.from({ length: Math.min(preview.photos, 6) }, (_, i) => (
                          <div 
                            key={i} 
                            className={`aspect-square bg-muted rounded-md ${showSensitive ? '' : 'blur-sm'} transition-all duration-200`}
                          >
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                              Photo {i + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Birthdays Section */}
                  {preview.birthdays > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Upcoming Birthdays ({preview.birthdays})
                      </h4>
                      <div className="space-y-2 pl-6">
                        {Array.from({ length: Math.min(preview.birthdays, 3) }, (_, i) => (
                          <div key={i} className="text-sm">
                            <div className={`${showSensitive ? '' : 'blur-sm'} transition-all duration-200`}>
                              🎂 Sample Family Member #{i + 1} - March {15 + i}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      This is a preview. Actual content will include your family's real stories, photos, and updates.
                    </p>
                  </div>
                </div>

                {!preview.is_unlocked && (
                  <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-800">
                        Some content is blurred for privacy. Digest will be unlocked when more family members join.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generation Info */}
          <div className="text-xs text-muted-foreground text-center">
            Preview generated on {new Date(preview.generated_at).toLocaleString()} 
            {preview.preview_date && ` • Data from ${formatDate(preview.preview_date)}`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}