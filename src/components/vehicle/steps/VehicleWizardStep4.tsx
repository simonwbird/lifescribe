import React, { useState, useEffect } from 'react'
import { MapPin, Wrench, Calendar, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import type { VehicleFormData, VehicleStatus } from '@/lib/vehicleTypes'

interface VehicleWizardStep4Props {
  formData: VehicleFormData
  onUpdate: (updates: Partial<VehicleFormData>) => void
}

interface Property {
  id: string
  name: string
}

const statusOptions: { value: VehicleStatus; label: string; description: string }[] = [
  { value: 'on-road', label: 'On Road', description: 'Currently registered and road-legal' },
  { value: 'off-road', label: 'Off Road', description: 'Not currently registered/SORN' },
  { value: 'sold', label: 'Sold', description: 'No longer owned by family' },
  { value: 'loaned', label: 'On Loan', description: 'Temporarily with someone else' }
]

export default function VehicleWizardStep4({
  formData,
  onUpdate
}: VehicleWizardStep4Props) {
  const [properties, setProperties] = useState<Property[]>([])
  const [accessories, setAccessories] = useState<string[]>([])
  const [newAccessory, setNewAccessory] = useState('')

  // Load family properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()

        if (!member) return

        const { data: familyProperties } = await supabase
          .from('properties')
          .select('id, name')
          .eq('family_id', member.family_id)
          .order('name')

        setProperties(familyProperties || [])
      } catch (error) {
        console.error('Error loading properties:', error)
      }
    }

    loadProperties()
  }, [])

  // Initialize accessories from form data
  useEffect(() => {
    setAccessories(formData.vehicleData.accessories || [])
  }, [formData.vehicleData.accessories])

  const updateVehicleData = (field: string, value: any) => {
    const keys = field.split('.')
    const newData = { ...formData.vehicleData }
    
    let current: any = newData
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
    
    onUpdate({ vehicleData: newData })
  }

  const addAccessory = () => {
    if (newAccessory.trim() && !accessories.includes(newAccessory.trim())) {
      const updated = [...accessories, newAccessory.trim()]
      setAccessories(updated)
      updateVehicleData('accessories', updated)
      setNewAccessory('')
    }
  }

  const removeAccessory = (accessory: string) => {
    const updated = accessories.filter(a => a !== accessory)
    setAccessories(updated)
    updateVehicleData('accessories', updated)
  }

  const calculateNextService = () => {
    const lastDate = formData.vehicleData.maintenance.lastServiceDate
    const lastOdo = formData.vehicleData.maintenance.lastServiceOdo
    const intervalMonths = formData.vehicleData.maintenance.intervalMonths
    const intervalMiles = formData.vehicleData.maintenance.intervalMiles
    const currentOdo = formData.vehicleData.metrics.odometer?.value

    let nextDate = ''
    let nextOdo = 0

    if (lastDate && intervalMonths) {
      const date = new Date(lastDate)
      date.setMonth(date.getMonth() + intervalMonths)
      nextDate = date.toISOString().split('T')[0]
      updateVehicleData('maintenance.nextServiceDate', nextDate)
    }

    if (lastOdo && intervalMiles) {
      nextOdo = lastOdo + intervalMiles
      updateVehicleData('maintenance.nextServiceOdo', nextOdo)
    }
  }

  const getUpcomingReminders = () => {
    const reminders = []
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))

    if (formData.vehicleData.reminders.inspectionDue) {
      const dueDate = new Date(formData.vehicleData.reminders.inspectionDue)
      if (dueDate <= thirtyDaysFromNow) {
        reminders.push({ type: 'MOT/Inspection', date: dueDate, urgent: dueDate <= now })
      }
    }

    if (formData.vehicleData.reminders.insuranceRenewal) {
      const dueDate = new Date(formData.vehicleData.reminders.insuranceRenewal)
      if (dueDate <= thirtyDaysFromNow) {
        reminders.push({ type: 'Insurance Renewal', date: dueDate, urgent: dueDate <= now })
      }
    }

    if (formData.vehicleData.reminders.taxDue) {
      const dueDate = new Date(formData.vehicleData.reminders.taxDue)
      if (dueDate <= thirtyDaysFromNow) {
        reminders.push({ type: 'Road Tax', date: dueDate, urgent: dueDate <= now })
      }
    }

    return reminders
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Maintenance & Location</h2>
        <p className="text-muted-foreground">
          Set up service schedules, reminders, and storage location for your vehicle.
        </p>
      </div>

      {/* Service & Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Service & Maintenance
          </CardTitle>
          <CardDescription>
            Track service history and set up maintenance reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Last Service */}
            <div>
              <h4 className="font-medium mb-3">Last Service</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="last-service-date">Service Date</Label>
                  <Input
                    id="last-service-date"
                    type="date"
                    value={formData.vehicleData.maintenance.lastServiceDate || ''}
                    onChange={(e) => updateVehicleData('maintenance.lastServiceDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="last-service-odo">Odometer Reading</Label>
                  <Input
                    id="last-service-odo"
                    type="number"
                    value={formData.vehicleData.maintenance.lastServiceOdo || ''}
                    onChange={(e) => updateVehicleData('maintenance.lastServiceOdo', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="125000"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Service Intervals */}
            <div>
              <h4 className="font-medium mb-3">Service Intervals</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interval-months">Every (months)</Label>
                  <Input
                    id="interval-months"
                    type="number"
                    value={formData.vehicleData.maintenance.intervalMonths || ''}
                    onChange={(e) => updateVehicleData('maintenance.intervalMonths', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="12"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="interval-miles">Every (miles/km)</Label>
                  <Input
                    id="interval-miles"
                    type="number"
                    value={formData.vehicleData.maintenance.intervalMiles || ''}
                    onChange={(e) => updateVehicleData('maintenance.intervalMiles', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="10000"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={calculateNextService}
                className="mt-3"
              >
                Calculate Next Service
              </Button>
            </div>

            {/* Consumables */}
            <div>
              <h4 className="font-medium mb-3">Consumables</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tyre-size">Tyre Size</Label>
                  <Input
                    id="tyre-size"
                    value={formData.vehicleData.maintenance.tyreSize || ''}
                    onChange={(e) => updateVehicleData('maintenance.tyreSize', e.target.value)}
                    placeholder="205/55 R16"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="oil-type">Oil Type</Label>
                  <Input
                    id="oil-type"
                    value={formData.vehicleData.maintenance.oilType || ''}
                    onChange={(e) => updateVehicleData('maintenance.oilType', e.target.value)}
                    placeholder="5W-30 Synthetic"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="battery-type">Battery Type</Label>
                  <Input
                    id="battery-type"
                    value={formData.vehicleData.maintenance.batteryType || ''}
                    onChange={(e) => updateVehicleData('maintenance.batteryType', e.target.value)}
                    placeholder="12V 70Ah"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Important Dates & Reminders
          </CardTitle>
          <CardDescription>
            Set up reminders for MOT, insurance, tax, and warranty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inspection-due">MOT/Inspection Due</Label>
              <Input
                id="inspection-due"
                type="date"
                value={formData.vehicleData.reminders.inspectionDue || ''}
                onChange={(e) => updateVehicleData('reminders.inspectionDue', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="insurance-renewal">Insurance Renewal</Label>
              <Input
                id="insurance-renewal"
                type="date"
                value={formData.vehicleData.reminders.insuranceRenewal || ''}
                onChange={(e) => updateVehicleData('reminders.insuranceRenewal', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tax-due">Road Tax Due</Label>
              <Input
                id="tax-due"
                type="date"
                value={formData.vehicleData.reminders.taxDue || ''}
                onChange={(e) => updateVehicleData('reminders.taxDue', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="warranty-end">Warranty End</Label>
              <Input
                id="warranty-end"
                type="date"
                value={formData.vehicleData.reminders.warrantyEnd || ''}
                onChange={(e) => updateVehicleData('reminders.warrantyEnd', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Upcoming Reminders Alert */}
          {getUpcomingReminders().length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Upcoming Reminders
                  </h4>
                  <div className="mt-2 space-y-1">
                    {getUpcomingReminders().map((reminder, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant={reminder.urgent ? "destructive" : "secondary"}>
                          {reminder.type}
                        </Badge>
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">
                          Due: {reminder.date.toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location & Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Storage Location
          </CardTitle>
          <CardDescription>
            Where is this vehicle usually kept?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property">Property</Label>
                <Select
                  value={formData.vehicleData.location.propertyId || ''}
                  onValueChange={(value) => updateVehicleData('location.propertyId', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select property..." />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="room-space">Garage/Space</Label>
                <Input
                  id="room-space"
                  value={formData.vehicleData.location.roomOrSpace || ''}
                  onChange={(e) => updateVehicleData('location.roomOrSpace', e.target.value)}
                  placeholder="e.g., Garage, Driveway, Shed"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Current Status</Label>
              <Select
                value={formData.vehicleData.status || 'on-road'}
                onValueChange={(value) => updateVehicleData('status', value as VehicleStatus)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div>
                        <div className="font-medium">{status.label}</div>
                        <div className="text-xs text-muted-foreground">{status.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessories */}
      <Card>
        <CardHeader>
          <CardTitle>Accessories & Extras</CardTitle>
          <CardDescription>
            Add any accessories, modifications, or extras included with the vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newAccessory}
                onChange={(e) => setNewAccessory(e.target.value)}
                placeholder="e.g., Roof rack, Towbar, Child seats..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAccessory())}
              />
              <Button onClick={addAccessory} disabled={!newAccessory.trim()}>
                Add
              </Button>
            </div>
            
            {accessories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {accessories.map((accessory) => (
                  <Badge 
                    key={accessory} 
                    variant="secondary" 
                    className="flex items-center gap-1"
                  >
                    {accessory}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeAccessory(accessory)}
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}