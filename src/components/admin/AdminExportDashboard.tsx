import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, Calendar, Users, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'

interface ExportOption {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  formats: string[]
  estimatedSize: string
}

const exportOptions: ExportOption[] = [
  {
    id: 'activity_log',
    title: 'Activity Log',
    description: 'Complete activity history with timestamps and user details',
    icon: Activity,
    formats: ['CSV', 'Excel', 'JSON'],
    estimatedSize: '~2.5MB'
  },
  {
    id: 'user_analytics',
    title: 'User Analytics',
    description: 'User engagement metrics, login frequency, and usage patterns',
    icon: Users,
    formats: ['CSV', 'Excel'],
    estimatedSize: '~800KB'
  },
  {
    id: 'content_report',
    title: 'Content Report',
    description: 'Stories, comments, and media statistics with moderation flags',
    icon: FileText,
    formats: ['PDF', 'Excel', 'CSV'],
    estimatedSize: '~5.2MB'
  },
  {
    id: 'monthly_digest',
    title: 'Monthly Digest Summary',
    description: 'Digest performance metrics and recipient engagement data',
    icon: Calendar,
    formats: ['PDF', 'CSV'],
    estimatedSize: '~1.1MB'
  }
]

interface AdminExportDashboardProps {
  className?: string
}

export default function AdminExportDashboard({ className }: AdminExportDashboardProps) {
  const [selectedExport, setSelectedExport] = useState<string>('')
  const [selectedFormat, setSelectedFormat] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const { track } = useAnalytics()

  const handleExport = async () => {
    if (!selectedExport || !selectedFormat) return
    
    setIsExporting(true)
    track('activity_clicked', { 
      type: selectedExport, 
      format: selectedFormat 
    })

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create a dummy file download
      const exportData = generateDummyData(selectedExport, selectedFormat)
      const blob = new Blob([exportData], { 
        type: getContentType(selectedFormat) 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedExport}_${new Date().toISOString().split('T')[0]}.${selectedFormat.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: 'Export completed',
        description: `${selectedExport.replace('_', ' ')} exported as ${selectedFormat}`,
      })
      
      track('activity_clicked', { 
        type: selectedExport, 
        format: selectedFormat 
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Unable to generate export. Please try again.',
        variant: 'destructive'
      })
      
      track('activity_clicked', { 
        type: selectedExport, 
        format: selectedFormat,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const generateDummyData = (exportType: string, format: string): string => {
    const timestamp = new Date().toISOString()
    
    switch (format) {
      case 'CSV':
        return `Export Type,${exportType}\nGenerated,${timestamp}\nSample Data,Value\nUsers Active,142\nStories Created,89\nComments Posted,234`
      case 'JSON':
        return JSON.stringify({
          exportType,
          generatedAt: timestamp,
          data: {
            usersActive: 142,
            storiesCreated: 89,
            commentsPosted: 234
          }
        }, null, 2)
      case 'Excel':
        return `Export Type\t${exportType}\nGenerated\t${timestamp}\nUsers Active\t142\nStories Created\t89\nComments Posted\t234`
      default:
        return `Export Report: ${exportType}\nGenerated: ${timestamp}\n\nSample administrative data for ${exportType}`
    }
  }

  const getContentType = (format: string): string => {
    switch (format) {
      case 'CSV': return 'text/csv'
      case 'JSON': return 'application/json'
      case 'Excel': return 'application/vnd.ms-excel'
      case 'PDF': return 'application/pdf'
      default: return 'text/plain'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Dashboard Data
        </CardTitle>
        <CardDescription>
          Generate reports and export administrative data for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Options */}
        <div className="grid gap-4 md:grid-cols-2">
          {exportOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedExport === option.id
            
            return (
              <div
                key={option.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
                onClick={() => {
                  setSelectedExport(option.id)
                  setSelectedFormat('')
                }}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{option.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {option.estimatedSize}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {option.formats.map((format) => (
                        <Badge 
                          key={format} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Format Selection */}
        {selectedExport && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Choose export format..." />
              </SelectTrigger>
              <SelectContent>
                {exportOptions
                  .find(opt => opt.id === selectedExport)
                  ?.formats.map((format) => (
                    <SelectItem key={format} value={format}>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        {format}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Export Button */}
        <Button 
          onClick={handleExport}
          disabled={!selectedExport || !selectedFormat || isExporting}
          className="w-full"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Generating Export...' : 'Export Data'}
        </Button>

        {/* Export Info */}
        {selectedExport && selectedFormat && (
          <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Export Type:</span>
              <span className="font-medium">
                {exportOptions.find(opt => opt.id === selectedExport)?.title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format:</span>
              <span className="font-medium">{selectedFormat}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Size:</span>
              <span className="font-medium">
                {exportOptions.find(opt => opt.id === selectedExport)?.estimatedSize}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}