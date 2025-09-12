import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, X, Plus, Upload, Scan } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import type { Field, ArtifactBase } from '@/lib/artifactTypes'

interface StepSpec {
  id: string
  title: string
  description?: string
  fields: Field[]
}

interface ArtifactWizardStepRendererProps {
  step: StepSpec
  formData: Partial<ArtifactBase>
  onUpdate: (updates: Partial<ArtifactBase>) => void
}

export default function ArtifactWizardStepRenderer({ 
  step, 
  formData, 
  onUpdate 
}: ArtifactWizardStepRendererProps) {
  const [people, setPeople] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  
  useEffect(() => {
    fetchRelatedData()
  }, [])

  const fetchRelatedData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch people
      const { data: peopleData } = await supabase
        .from('people')
        .select('id, full_name')
        .order('full_name')

      // Fetch properties  
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, name, address')
        .order('name')

      setPeople(peopleData || [])
      setProperties(propertiesData || [])
    } catch (error) {
      console.error('Error fetching related data:', error)
    }
  }

  const updateField = (fieldId: string, value: any) => {
    if (['title', 'description', 'tags', 'peopleIds', 'propertyId', 'room'].includes(fieldId)) {
      onUpdate({ [fieldId]: value })
    } else {
      onUpdate({
        categorySpecific: {
          ...formData.categorySpecific,
          [fieldId]: value
        }
      })
    }
  }

  const getFieldValue = (fieldId: string) => {
    if (['title', 'description', 'tags', 'peopleIds', 'propertyId', 'room'].includes(fieldId)) {
      return formData[fieldId as keyof ArtifactBase] || ''
    }
    return formData.categorySpecific?.[fieldId] || ''
  }

  const renderField = (field: Field) => {
    const value = getFieldValue(field.id)

    switch (field.kind) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value as string}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder={field.help}
              required={field.required}
            />
            {field.help && (
              <p className="text-xs text-muted-foreground">{field.help}</p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value as string}
              onChange={(e) => updateField(field.id, e.target.value)}
              rows={3}
              required={field.required}
            />
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex gap-2">
              <Input
                id={field.id}
                type="number"
                value={value as number || ''}
                onChange={(e) => updateField(field.id, parseFloat(e.target.value) || null)}
                required={field.required}
              />
              {field.unit && (
                <Badge variant="outline" className="px-3 flex items-center">
                  {field.unit}
                </Badge>
              )}
            </div>
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value as string || ''}
              onValueChange={(val) => updateField(field.id, val)}
              required={field.required}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'chips':
        const chipValues = (value as string[]) || []
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-3">
              {field.options && (
                <div className="flex flex-wrap gap-2">
                  {field.options.map((option) => (
                    <Badge
                      key={option}
                      variant={chipValues.includes(option) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newValues = chipValues.includes(option)
                          ? chipValues.filter(v => v !== option)
                          : [...chipValues, option]
                        updateField(field.id, newValues)
                      }}
                    >
                      {option}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {chipValues.map((chip, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {chip}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        const newValues = chipValues.filter((_, i) => i !== index)
                        updateField(field.id, newValues)
                      }}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )

      case 'date':
        const dateValue = value ? new Date(value as string) : undefined
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateValue && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateValue ? format(dateValue, "PPP") : `Select ${field.label.toLowerCase()}...`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={(date) => updateField(field.id, date?.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {field.approximate && (
              <p className="text-xs text-muted-foreground">
                Approximate dates are fine - we'll mark it as estimated
              </p>
            )}
          </div>
        )

      case 'ocr':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  OCR Text Extraction
                </CardTitle>
                <CardDescription>
                  Upload an image to extract text from {field.source}s
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {field.source} for text extraction
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case 'dimensions':
        const dimensions = (value as any) || { width: '', height: '', depth: '', unit: field.units[0] }
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="Width"
                type="number"
                value={dimensions.width || ''}
                onChange={(e) => updateField(field.id, { ...dimensions, width: e.target.value })}
              />
              <Input
                placeholder="Height"
                type="number"
                value={dimensions.height || ''}
                onChange={(e) => updateField(field.id, { ...dimensions, height: e.target.value })}
              />
              <Input
                placeholder="Depth"
                type="number"
                value={dimensions.depth || ''}
                onChange={(e) => updateField(field.id, { ...dimensions, depth: e.target.value })}
              />
              <Select
                value={dimensions.unit || field.units[0]}
                onValueChange={(unit) => updateField(field.id, { ...dimensions, unit })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'money':
        const moneyValue = (value as any) || { amount: '', currency: field.currency || 'USD' }
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
              {field.private && <Badge variant="secondary" className="ml-2">Private</Badge>}
            </Label>
            <div className="flex gap-2">
              <Select
                value={moneyValue.currency || 'USD'}
                onValueChange={(currency) => updateField(field.id, { ...moneyValue, currency })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={moneyValue.amount || ''}
                onChange={(e) => updateField(field.id, { ...moneyValue, amount: e.target.value })}
                required={field.required}
              />
            </div>
            {field.private && (
              <p className="text-xs text-muted-foreground">
                This value will be kept private and only visible to you
              </p>
            )}
          </div>
        )

      case 'relation':
        const relationValue = (value as string[]) || []
        const dataSource = field.to === 'people' ? people : field.to === 'property' ? properties : []
        
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value=""
              onValueChange={(val) => {
                if (!relationValue.includes(val)) {
                  updateField(field.id, [...relationValue, val])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.to}...`} />
              </SelectTrigger>
              <SelectContent>
                {dataSource.map((item: any) => (
                  <SelectItem key={item.id} value={item.id}>
                    {field.to === 'people' ? item.full_name : `${item.name}${item.address ? ` (${item.address})` : ''}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex flex-wrap gap-2">
              {relationValue.map((id) => {
                const item = dataSource.find((d: any) => d.id === id)
                if (!item) return null
                
                return (
                  <Badge key={id} variant="secondary" className="gap-1">
                    {field.to === 'people' ? item.full_name : item.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        const newValues = relationValue.filter(v => v !== id)
                        updateField(field.id, newValues)
                      }}
                    />
                  </Badge>
                )
              })}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {step.fields.map(renderField)}
    </div>
  )
}