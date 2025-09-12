import React, { useState, useEffect } from 'react'
import { Upload, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import type { VehicleFormData, OdometerUnit } from '@/lib/vehicleTypes'

interface VehicleWizardStep2Props {
  formData: VehicleFormData
  onUpdate: (updates: Partial<VehicleFormData>) => void
}

interface Person {
  id: string
  full_name: string
}

const odometerUnits: { value: OdometerUnit; label: string }[] = [
  { value: 'mi', label: 'Miles' },
  { value: 'km', label: 'Kilometers' },
  { value: 'hours', label: 'Hours' }
]

const countries = [
  { value: 'UK', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'other', label: 'Other' }
]

export default function VehicleWizardStep2({
  formData,
  onUpdate
}: VehicleWizardStep2Props) {
  const [people, setPeople] = useState<Person[]>([])
  const [logbookFile, setLogbookFile] = useState<File | null>(null)

  // Load family members
  useEffect(() => {
    const loadPeople = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()

        if (!member) return

        const { data: familyPeople } = await supabase
          .from('people')
          .select('id, full_name')
          .eq('family_id', member.family_id)
          .order('full_name')

        setPeople(familyPeople || [])
      } catch (error) {
        console.error('Error loading people:', error)
      }
    }

    loadPeople()
  }, [])

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

  const handleLogbookUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogbookFile(file)
      // In a real app, you'd process OCR here to extract plate/VIN
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Identity & Ownership</h2>
        <p className="text-muted-foreground">
          Add registration details, identifiers, and ownership information.
        </p>
      </div>

      {/* Registration & Identifiers */}
      <Card>
        <CardHeader>
          <CardTitle>Registration & Identifiers</CardTitle>
          <CardDescription>
            Registration plate, VIN, and other identifying numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="plate">Registration/Plate Number</Label>
                <Input
                  id="plate"
                  value={formData.vehicleData.identifiers.plate?.number || ''}
                  onChange={(e) => updateVehicleData('identifiers.plate.number', e.target.value)}
                  placeholder="e.g., ABC123, XYZ-789"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.vehicleData.identifiers.plate?.country || ''}
                  onValueChange={(value) => updateVehicleData('identifiers.plate.country', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="vin">VIN / Serial / Hull Number</Label>
              <Input
                id="vin"
                value={formData.vehicleData.identifiers.vinOrSerial || ''}
                onChange={(e) => updateVehicleData('identifiers.vinOrSerial', e.target.value)}
                placeholder="e.g., 1HGBH41JXMN109186"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                VIN for cars, frame number for bikes, hull number for boats
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Odometer & Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Odometer & Engine Details</CardTitle>
          <CardDescription>
            Current mileage/hours and engine specifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="odometer">Odometer Reading</Label>
              <Input
                id="odometer"
                type="number"
                value={formData.vehicleData.metrics.odometer?.value || ''}
                onChange={(e) => updateVehicleData('metrics.odometer.value', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="125000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.vehicleData.metrics.odometer?.unit || 'mi'}
                onValueChange={(value) => updateVehicleData('metrics.odometer.unit', value as OdometerUnit)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {odometerUnits.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.vehicleData.specs.type === 'car' && (
              <>
                <div>
                  <Label htmlFor="engine">Engine Size (cc)</Label>
                  <Input
                    id="engine"
                    type="number"
                    value={formData.vehicleData.metrics.engineCc || ''}
                    onChange={(e) => updateVehicleData('metrics.engineCc', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="2000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="power">Power (kW)</Label>
                  <Input
                    id="power"
                    type="number"
                    value={formData.vehicleData.metrics.powerKw || ''}
                    onChange={(e) => updateVehicleData('metrics.powerKw', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="150"
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {formData.vehicleData.specs.fuel === 'ev' && (
              <>
                <div>
                  <Label htmlFor="battery">Battery Capacity (kWh)</Label>
                  <Input
                    id="battery"
                    type="number"
                    value={formData.vehicleData.metrics.batteryKwh || ''}
                    onChange={(e) => updateVehicleData('metrics.batteryKwh', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="75"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="connector">Charge Connector</Label>
                  <Input
                    id="connector"
                    value={formData.vehicleData.metrics.chargeConnector || ''}
                    onChange={(e) => updateVehicleData('metrics.chargeConnector', e.target.value)}
                    placeholder="Type 2, CCS, CHAdeMO"
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ownership */}
      <Card>
        <CardHeader>
          <CardTitle>Ownership & Custodianship</CardTitle>
          <CardDescription>
            Who owns and primarily uses this vehicle?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary-driver">Primary Driver</Label>
              <Select
                value={formData.vehicleData.ownership.primaryDriver || ''}
                onValueChange={(value) => updateVehicleData('ownership.primaryDriver', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select person..." />
                </SelectTrigger>
                <SelectContent>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {person.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="custodian">Current Custodian</Label>
              <Select
                value={formData.vehicleData.ownership.custodian || ''}
                onValueChange={(value) => updateVehicleData('ownership.custodian', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select person..." />
                </SelectTrigger>
                <SelectContent>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {person.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ownership-start">Ownership Start</Label>
              <Input
                id="ownership-start"
                type="date"
                value={formData.vehicleData.ownership.ownershipStart || ''}
                onChange={(e) => updateVehicleData('ownership.ownershipStart', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ownership-end">Ownership End</Label>
              <Input
                id="ownership-end"
                type="date"
                value={formData.vehicleData.ownership.ownershipEnd || ''}
                onChange={(e) => updateVehicleData('ownership.ownershipEnd', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank if still owned
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logbook Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Title/Logbook Document</CardTitle>
          <CardDescription>
            Upload the vehicle's title, logbook, or registration document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="flex flex-col items-center justify-center text-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <Label htmlFor="logbook-upload" className="cursor-pointer">
                  <span className="text-sm font-medium">Click to upload logbook</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </Label>
                <Input
                  id="logbook-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleLogbookUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            {logbookFile && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{logbookFile.name}</Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLogbookFile(null)}
                >
                  Remove
                </Button>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              We'll automatically extract key details like registration number and VIN where possible.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}