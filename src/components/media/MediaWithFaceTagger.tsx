import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tag, X } from 'lucide-react'
import FaceTagger from './FaceTagger'

interface MediaWithFaceTaggerProps {
  imageUrl: string
  imageId: string
  familyId: string
  onTagged?: () => void
}

export default function MediaWithFaceTagger({
  imageUrl,
  imageId,
  familyId,
  onTagged,
}: MediaWithFaceTaggerProps) {
  const [isTagging, setIsTagging] = useState(false)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 relative">
        {isTagging ? (
          <div className="relative min-h-[400px]">
            <FaceTagger
              imageUrl={imageUrl}
              imageId={imageId}
              familyId={familyId}
              onTagged={() => {
                setIsTagging(false)
                onTagged?.()
              }}
              onCancel={() => setIsTagging(false)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
              onClick={() => setIsTagging(false)}
              aria-label="Exit tagging mode"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative group">
            <img
              src={imageUrl}
              alt="Family photo"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                onClick={() => setIsTagging(true)}
                className="gap-2"
                aria-label="Start tagging faces"
              >
                <Tag className="h-4 w-4" />
                Tag Faces
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
