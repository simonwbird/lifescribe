import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WifiOff, CloudOff } from 'lucide-react'

interface OfflineQueueCardProps {
  onProceed: () => void
  onCancel: () => void
}

export function OfflineQueueCard({ onProceed, onCancel }: OfflineQueueCardProps) {
  return (
    <Card className="w-full border-warning/50 bg-warning/5">
      <CardContent className="p-6">
        <div className="space-y-4 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-warning" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              You're offline
            </h3>
            <p className="text-sm text-muted-foreground">
              You can still record your story. We'll upload it when you're back online.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={onProceed}
              size="lg"
              className="flex-1"
            >
              <CloudOff className="w-4 h-4 mr-2" />
              Record anyway
            </Button>
            
            <Button
              onClick={onCancel}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Wait for connection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}