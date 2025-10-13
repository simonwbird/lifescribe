import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Upload, 
  Play, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Loader2,
  Trash2,
  Eye
} from 'lucide-react'
import { useBulkUpload } from '@/hooks/useBulkUpload'
import { cn } from '@/lib/utils'

export function BulkUploadPanel() {
  const [isDragOver, setIsDragOver] = useState(false)
  const { items, stats, isProcessing, addFiles, startProcessing, clearCompleted, clearAll } = useBulkUpload()
  const [showReviewModal, setShowReviewModal] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      addFiles(files)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'needs_review':
        return <Eye className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const overallProgress = stats.total > 0 
    ? ((stats.success + stats.failed + stats.needsReview) / stats.total) * 100 
    : 0

  return (
    <Card className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Bulk Upload</h3>
          </div>
          {stats.total > 0 && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearCompleted}
                disabled={stats.success === 0}
              >
                Clear Done
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearAll}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {stats.success + stats.failed + stats.needsReview} / {stats.total} processed
              </span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                {stats.success} Success
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3 text-red-600" />
                {stats.failed} Failed
              </Badge>
              {stats.needsReview > 0 && (
                <Badge 
                  variant="secondary" 
                  className="gap-1 cursor-pointer hover:bg-yellow-100"
                  onClick={() => setShowReviewModal(true)}
                >
                  <Eye className="h-3 w-3 text-yellow-600" />
                  {stats.needsReview} Review
                </Badge>
              )}
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3 text-gray-600" />
                {stats.pending} Pending
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      {items.length === 0 ? (
        <div
          className={cn(
            'flex-1 flex items-center justify-center p-8',
            isDragOver && 'bg-primary/5 border-primary'
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-2">Drop images here</h4>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="outline" asChild>
                  <span>Select Files</span>
                </Button>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Items List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{(item.file.size / 1024).toFixed(0)} KB</span>
                      {item.metadata?.dateTaken && (
                        <span>• {new Date(item.metadata.dateTaken).toLocaleDateString()}</span>
                      )}
                      {item.metadata?.faces && item.metadata.faces.length > 0 && (
                        <span>• {item.metadata.faces.length} faces</span>
                      )}
                    </div>
                    {item.status === 'processing' && (
                      <Progress value={item.progress} className="h-1 mt-2" />
                    )}
                    {item.error && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />
                <Button 
                  variant="outline" 
                  className="w-full" 
                  asChild
                  disabled={isProcessing}
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Add More
                  </span>
                </Button>
              </label>
              
              <Button
                onClick={startProcessing}
                disabled={isProcessing || stats.pending === 0}
                className="flex-1 gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
