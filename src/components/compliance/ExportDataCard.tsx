import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileArchive, Clock, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useEventTracking } from '@/hooks/useEventTracking'
import { ComplianceService } from '@/lib/complianceService'
import type { ExportAnalysis } from '@/lib/complianceTypes'

export default function ExportDataCard() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportData, setExportData] = useState<ExportAnalysis | null>(null)
  const [includeMedia, setIncludeMedia] = useState(true)
  const { toast } = useToast()
  const { trackExportRequested, trackExportCompleted } = useEventTracking()

  const handleRequestExport = async () => {
    setIsExporting(true)
    try {
      // Track export request
      await trackExportRequested({
        export_format: includeMedia ? 'zip' : 'json',
        data_types: includeMedia ? ['stories', 'media', 'comments', 'profiles'] : ['stories', 'comments', 'profiles'],
        estimated_size_mb: 0 // Will be updated when we get the result
      })

      const result = await ComplianceService.requestEnhancedExport(includeMedia)
      setExportData(result)
      
      // Track export completion
      await trackExportCompleted({
        export_format: includeMedia ? 'zip' : 'json',
        file_size_mb: result.estimated_size_mb,
        processing_time_minutes: 0, // Edge function would need to return this
        items_exported: {
          stories: result.media_count > 0 ? Math.floor(result.media_count * 0.3) : 0, // Estimate
          photos: result.media_count,
          comments: result.media_count > 0 ? Math.floor(result.media_count * 0.1) : 0, // Estimate
          people: 0 // Would need to be returned by the export service
        },
        download_expires_days: 30 // Standard expiry
      })
      
      toast({
        title: 'Export Ready',
        description: `Your data export (${result.estimated_size_mb} MB) is ready for download.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export Failed',
        description: 'There was an error preparing your data export. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = () => {
    if (!exportData) return
    
    try {
      ComplianceService.downloadExportFile(exportData)
      toast({
        title: 'Download Started',
        description: 'Your data export download has started.',
      })
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'There was an error downloading your data. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const getExpiryDays = () => {
    if (!exportData) return 0
    const expiryDate = new Date(exportData.expires_at)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="h-5 w-5" />
          Export My Data
        </CardTitle>
        <CardDescription>
          Download a complete archive of your stories, photos, and family data in compliance with GDPR/CCPA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!exportData ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-media"
                checked={includeMedia}
                onCheckedChange={(checked) => setIncludeMedia(checked as boolean)}
              />
              <label
                htmlFor="include-media"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include media files (photos, audio, videos)
              </label>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Your export will include:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your profile information</li>
                <li>• All stories you've created</li>
                <li>• Comments and reactions you've made</li>
                <li>• Recipes, properties, and pets you've added</li>
                {includeMedia && <li>• Media files you've uploaded (photos, audio, transcripts)</li>}
                <li>• Complete data index in JSON format</li>
              </ul>
            </div>

            <Button 
              onClick={handleRequestExport} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Preparing Export...
                </>
              ) : (
                <>
                  <FileArchive className="h-4 w-4 mr-2" />
                  Request Data Export
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={exportData.status === 'ready' ? 'default' : 'secondary'}>
                    {exportData.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {exportData.estimated_size_mb} MB
                  </span>
                </div>
                {exportData.media_count > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Includes {exportData.media_count} media files
                  </p>
                )}
              </div>
              
              {exportData.status === 'ready' && (
                <Button onClick={handleDownload} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Export expires in {getExpiryDays()} days
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Download links expire for security. Request a new export if needed.
              </p>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setExportData(null)}
              className="w-full"
            >
              Request New Export
            </Button>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Privacy Notice</p>
              <p>
                Your data export is encrypted and secure. Links expire automatically. 
                This export includes only data you created or have access to.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}