import { Badge } from '@/components/ui/badge'
import { CloudOff, CloudUpload, CheckCircle, AlertCircle } from 'lucide-react'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import { cn } from '@/lib/utils'

export function OfflineSyncBadge() {
  const { unsyncedCount, isSyncing } = useOfflineQueue()

  if (unsyncedCount === 0 && !isSyncing) {
    return null
  }

  return (
    <Badge 
      variant={isSyncing ? 'default' : 'secondary'}
      className={cn(
        'gap-1.5 font-medium',
        isSyncing && 'animate-pulse'
      )}
    >
      {isSyncing ? (
        <>
          <CloudUpload className="h-3 w-3" />
          Syncing...
        </>
      ) : (
        <>
          <CloudOff className="h-3 w-3" />
          {unsyncedCount} Queued
        </>
      )}
    </Badge>
  )
}

export function SyncStatusIndicator({ status }: { status: 'queued' | 'syncing' | 'synced' | 'failed' }) {
  const icons = {
    queued: <CloudOff className="h-4 w-4 text-yellow-600" />,
    syncing: <CloudUpload className="h-4 w-4 text-blue-600 animate-pulse" />,
    synced: <CheckCircle className="h-4 w-4 text-green-600" />,
    failed: <AlertCircle className="h-4 w-4 text-red-600" />
  }

  const labels = {
    queued: 'Queued',
    syncing: 'Syncing',
    synced: 'Synced',
    failed: 'Failed'
  }

  return (
    <div className="flex items-center gap-2">
      {icons[status]}
      <span className="text-sm font-medium">{labels[status]}</span>
    </div>
  )
}
