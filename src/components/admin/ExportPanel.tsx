import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  FileText, 
  Users, 
  BarChart3, 
  Archive,
  Calendar,
  FileSpreadsheet,
  FileJson
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useSecureRoles } from '@/hooks/useSecureRoles'

interface ExportPanelProps {
  familyId: string
  compact?: boolean
}

type ExportType = 'stories' | 'engagement' | 'members' | 'full'
type ExportFormat = 'json' | 'csv'

export function ExportPanel({ familyId, compact = false }: ExportPanelProps) {
  const [exportType, setExportType] = useState<ExportType>('stories')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()
  const { data: userRoles } = useSecureRoles()

  // Check if current user is admin
  const isUserAdmin = userRoles?.familyRoles.some(
    role => role.familyId === familyId && role.role === 'admin'
  ) || userRoles?.systemRole === 'super_admin'

  if (!isUserAdmin) {
    return null
  }

  const exportOptions = [
    {
      value: 'stories' as ExportType,
      label: 'Stories & Comments',
      description: 'All family stories with comments and reactions',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      value: 'engagement' as ExportType,
      label: 'Engagement Stats',
      description: 'Activity trends, top contributors, and metrics',
      icon: BarChart3,
      color: 'text-green-600'
    },
    {
      value: 'members' as ExportType,
      label: 'Family Members',
      description: 'Member list with roles and join dates',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      value: 'full' as ExportType,
      label: 'Complete Export',
      description: 'All data including stories, members, and invites',
      icon: Archive,
      color: 'text-orange-600'
    }
  ]

  const handleExport = async () => {
    if (!familyId) return

    setLoading(true)
    try {
      const exportRequest = {
        familyId,
        exportType,
        format: exportFormat,
        ...(dateStart && dateEnd && {
          dateRange: {
            start: dateStart,
            end: dateEnd
          }
        })
      }

      const { data, error } = await supabase.functions.invoke('export-family-data', {
        body: exportRequest
      })

      if (error) {
        throw new Error(error.message)
      }

      // Create download
      const blob = new Blob([data], { 
        type: exportFormat === 'csv' ? 'text/csv' : 'application/json' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const timestamp = new Date().toISOString().split('T')[0]
      link.download = `family-${exportType}-${timestamp}.${exportFormat}`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export completed!',
        description: `Your ${exportType} data has been downloaded`
      })

    } catch (error: any) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedOption = exportOptions.find(option => option.value === exportType)
  const Icon = selectedOption?.icon || FileText

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Exporting...' : 'Export'}
          </Button>
          
          <Select value={exportType} onValueChange={(value: ExportType) => setExportType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exportOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Family Data
        </CardTitle>
        <CardDescription>
          Download reports and data about your family's stories and activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">What to Export</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exportOptions.map((option) => {
              const OptionIcon = option.icon
              const isSelected = exportType === option.value
              
              return (
                <Card 
                  key={option.value}
                  className={`cursor-pointer transition-all border-2 ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setExportType(option.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <OptionIcon className={`h-5 w-5 mt-0.5 ${option.color}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{option.label}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Format and Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="format">File Format</Label>
            <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON (Detailed)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (Spreadsheet)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="text-sm"
              />
              <Input
                type="date"
                placeholder="End date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Export Info */}
        {selectedOption && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 mt-0.5 ${selectedOption.color}`} />
              <div>
                <h4 className="font-medium text-sm">Exporting: {selectedOption.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedOption.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {exportFormat.toUpperCase()}
                  </Badge>
                  {dateStart && dateEnd && (
                    <Badge variant="outline" className="text-xs">
                      {dateStart} to {dateEnd}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <Button 
          onClick={handleExport}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground mr-2" />
              Preparing Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download {selectedOption?.label}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Exports are generated securely and only accessible to family admins
        </p>
      </CardContent>
    </Card>
  )
}