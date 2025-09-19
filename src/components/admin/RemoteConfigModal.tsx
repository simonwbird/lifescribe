import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, RotateCcw, Clock, Upload, Shield, Users } from 'lucide-react'
import { RemoteConfig } from '@/lib/featureFlagTypes'
import { useFeatureFlagAdmin } from '@/hooks/useFeatureFlags'
import { useToast } from '@/hooks/use-toast'

interface RemoteConfigModalProps {
  config: RemoteConfig[]
  isOpen: boolean
  onClose: () => void
}

export const RemoteConfigModal = ({ config, isOpen, onClose }: RemoteConfigModalProps) => {
  const [editedValues, setEditedValues] = useState<Record<string, any>>({})
  const { updateConfig } = useFeatureFlagAdmin()
  const { toast } = useToast()

  const handleValueChange = (configId: string, value: any, valueType: string) => {
    let parsedValue = value
    
    try {
      switch (valueType) {
        case 'number':
          parsedValue = parseFloat(value) || 0
          break
        case 'boolean':
          parsedValue = Boolean(value)
          break
        case 'json':
          parsedValue = JSON.parse(value)
          break
        default:
          parsedValue = String(value)
      }
    } catch (error) {
      // Keep as string if JSON parsing fails
      parsedValue = value
    }

    setEditedValues(prev => ({
      ...prev,
      [configId]: parsedValue
    }))
  }

  const handleSave = async (configItem: RemoteConfig) => {
    try {
      const newValue = editedValues[configItem.id] !== undefined 
        ? editedValues[configItem.id] 
        : configItem.current_value

      await updateConfig(configItem.id, { current_value: newValue })
      
      // Remove from edited values after successful save
      setEditedValues(prev => {
        const updated = { ...prev }
        delete updated[configItem.id]
        return updated
      })

      toast({
        title: 'Success',
        description: `${configItem.name} updated successfully`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update ${configItem.name}`,
        variant: 'destructive'
      })
    }
  }

  const handleReset = (configItem: RemoteConfig) => {
    setEditedValues(prev => {
      const updated = { ...prev }
      delete updated[configItem.id]
      return updated
    })
  }

  const getCurrentValue = (configItem: RemoteConfig) => {
    return editedValues[configItem.id] !== undefined 
      ? editedValues[configItem.id] 
      : configItem.current_value
  }

  const hasChanges = (configId: string) => {
    return editedValues[configId] !== undefined
  }

  const getConfigIcon = (key: string) => {
    if (key.includes('prompt')) return <RotateCcw className="h-4 w-4" />
    if (key.includes('upload') || key.includes('size')) return <Upload className="h-4 w-4" />
    if (key.includes('autosave') || key.includes('interval')) return <Clock className="h-4 w-4" />
    if (key.includes('digest') || key.includes('threshold')) return <Users className="h-4 w-4" />
    if (key.includes('security') || key.includes('protect')) return <Shield className="h-4 w-4" />
    return <Settings className="h-4 w-4" />
  }

  const renderValueInput = (configItem: RemoteConfig) => {
    const currentValue = getCurrentValue(configItem)

    switch (configItem.value_type) {
      case 'boolean':
        return (
          <Switch
            checked={Boolean(currentValue)}
            onCheckedChange={(checked) => handleValueChange(configItem.id, checked, configItem.value_type)}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={Number(currentValue) || 0}
            onChange={(e) => handleValueChange(configItem.id, e.target.value, configItem.value_type)}
            className="w-32"
          />
        )

      case 'json':
        return (
          <textarea
            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
            onChange={(e) => handleValueChange(configItem.id, e.target.value, configItem.value_type)}
            className="w-full min-h-[100px] p-2 border rounded-md font-mono text-sm"
            placeholder="Enter valid JSON..."
          />
        )

      default:
        return (
          <Input
            value={String(currentValue) || ''}
            onChange={(e) => handleValueChange(configItem.id, e.target.value, configItem.value_type)}
            className="w-64"
          />
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Remote Configuration
          </DialogTitle>
          <DialogDescription>
            Manage application settings that can be updated without code deployment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Default Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.map((configItem: RemoteConfig) => (
                  <TableRow key={configItem.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getConfigIcon(configItem.key)}
                          <span className="font-medium">{configItem.name}</span>
                          {hasChanges(configItem.id) && (
                            <Badge variant="outline" className="text-xs">
                              Modified
                            </Badge>
                          )}
                        </div>
                        {configItem.description && (
                          <div className="text-sm text-muted-foreground">
                            {configItem.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Key: <code>{configItem.key}</code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {renderValueInput(configItem)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {configItem.value_type === 'json' 
                          ? JSON.stringify(configItem.default_value)
                          : String(configItem.default_value)
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {configItem.value_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={configItem.is_active ? 'default' : 'secondary'}>
                        {configItem.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasChanges(configItem.id) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReset(configItem)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave(configItem)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Help Text */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Configuration Guidelines</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Changes take effect immediately across the application</li>
              <li>• Boolean values: Use the toggle switch</li>
              <li>• Number values: Enter numeric values only</li>
              <li>• JSON values: Must be valid JSON format</li>
              <li>• String values: Plain text input</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
