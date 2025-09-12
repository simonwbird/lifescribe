import React from 'react'
import { Car, Bike, Ship, Truck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { 
  VehicleFormData, 
  VehicleType,
  FuelType, 
  TransmissionType, 
  DriveType 
} from '@/lib/vehicleTypes'

interface VehicleWizardStep1Props {
  formData: VehicleFormData
  onUpdate: (updates: Partial<VehicleFormData>) => void
}

const vehicleTypeOptions: { value: VehicleType; label: string; icon: any; description: string }[] = [
  { value: 'car', label: 'Car', icon: Car, description: 'Cars, hatchbacks, sedans, SUVs' },
  { value: 'motorbike', label: 'Motorbike', icon: Bike, description: 'Motorcycles, scooters, mopeds' },
  { value: 'bicycle', label: 'Bicycle', icon: Bike, description: 'Bicycles, e-bikes, tricycles' },
  { value: 'boat', label: 'Boat', icon: Ship, description: 'Boats, yachts, jet skis, dinghies' },
  { value: 'caravan', label: 'Caravan/Motorhome', icon: Truck, description: 'Caravans, motorhomes, RVs' },
  { value: 'trailer', label: 'Trailer', icon: Truck, description: 'Trailers, box trailers, utility trailers' }
]

const fuelOptions: { value: FuelType; label: string }[] = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'ev', label: 'Electric (EV)' },
  { value: 'other', label: 'Other' }
]

const transmissionOptions: { value: TransmissionType; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'auto', label: 'Automatic' },
  { value: 'cvt', label: 'CVT' },
  { value: 'other', label: 'Other' }
]

const driveOptions: { value: DriveType; label: string }[] = [
  { value: 'fwd', label: 'Front Wheel Drive (FWD)' },
  { value: 'rwd', label: 'Rear Wheel Drive (RWD)' },
  { value: 'awd', label: 'All Wheel Drive (AWD)' },
  { value: '4x4', label: '4x4 / 4WD' },
  { value: 'na', label: 'Not Applicable' }
]

export default function VehicleWizardStep1({
  formData,
  onUpdate
}: VehicleWizardStep1Props) {
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

  const handleTitleChange = (value: string) => {
    onUpdate({ title: value })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Vehicle Basics</h2>
        <p className="text-muted-foreground">
          Start by telling us what type of vehicle this is and its basic details.
        </p>
      </div>

      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Name</CardTitle>
          <CardDescription>
            Give this vehicle a memorable name for your family archive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Name *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Dad's Ford Mustang, Family Caravan, Racing Bike"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Type */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Type</CardTitle>
          <CardDescription>
            Select the type of vehicle you're adding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.vehicleData.specs.type}
            onValueChange={(value) => updateVehicleData('specs.type', value as VehicleType)}
            className="grid grid-cols-2 gap-4"
          >
            {vehicleTypeOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-lg border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors"
                    )}
                  >
                    <IconComponent className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </div>
                    </div>
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
          <CardDescription>
            Enter the make, model, and other basic information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.vehicleData.specs.make || ''}
                onChange={(e) => updateVehicleData('specs.make', e.target.value)}
                placeholder="e.g., Ford, Toyota, BMW"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.vehicleData.specs.model || ''}
                onChange={(e) => updateVehicleData('specs.model', e.target.value)}
                placeholder="e.g., Mustang, Camry, X3"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="variant">Variant/Trim</Label>
              <Input
                id="variant"
                value={formData.vehicleData.specs.variant || ''}
                onChange={(e) => updateVehicleData('specs.variant', e.target.value)}
                placeholder="e.g., GT, Sport, Premium"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={formData.vehicleData.specs.year || ''}
                onChange={(e) => updateVehicleData('specs.year', e.target.value)}
                placeholder="e.g., 2020"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.vehicleData.specs.color || ''}
                onChange={(e) => updateVehicleData('specs.color', e.target.value)}
                placeholder="e.g., Red, Blue, Silver"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      {formData.vehicleData.specs.type !== 'bicycle' && (
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
            <CardDescription>
              Fuel type, transmission, and drivetrain information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fuel">Fuel/Power</Label>
                <Select
                  value={formData.vehicleData.specs.fuel || ''}
                  onValueChange={(value) => updateVehicleData('specs.fuel', value as FuelType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select fuel type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.vehicleData.specs.type === 'car' && (
                <>
                  <div>
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select
                      value={formData.vehicleData.specs.transmission || ''}
                      onValueChange={(value) => updateVehicleData('specs.transmission', value as TransmissionType)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select transmission..." />
                      </SelectTrigger>
                      <SelectContent>
                        {transmissionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="drive">Drive Type</Label>
                    <Select
                      value={formData.vehicleData.specs.drive || ''}
                      onValueChange={(value) => updateVehicleData('specs.drive', value as DriveType)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select drive type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {driveOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
          <CardDescription>
            Who can see this vehicle in the family archive?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.visibility}
            onValueChange={(value) => onUpdate({ visibility: value as 'family' | 'branch' | 'private' })}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="family" id="family" />
              <Label htmlFor="family">Family - All family members can see</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="branch" id="branch" />
              <Label htmlFor="branch">Branch - Only my branch can see</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private">Private - Only I can see</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}