import React from 'react'
import { Car, MapPin, Calendar, Wrench, AlertTriangle, FileText, Camera } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { VehicleFormData } from '@/lib/vehicleTypes'

interface VehicleWizardStep5Props {
  formData: VehicleFormData
  onUpdate: (updates: Partial<VehicleFormData>) => void
  onPublish: () => void
}

export default function VehicleWizardStep5({
  formData,
  onUpdate,
  onPublish
}: VehicleWizardStep5Props) {
  const getVehicleDisplayName = () => {
    const { make, model, year } = formData.vehicleData.specs
    return [make, model, year].filter(Boolean).join(' ') || 'Vehicle'
  }

  const getUpcomingReminders = () => {
    const reminders = []
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))

    if (formData.vehicleData.reminders.inspectionDue) {
      const dueDate = new Date(formData.vehicleData.reminders.inspectionDue)
      if (dueDate <= thirtyDaysFromNow) {
        reminders.push({ 
          type: 'MOT/Inspection', 
          date: dueDate.toLocaleDateString(),
          urgent: dueDate <= now 
        })
      }
    }

    if (formData.vehicleData.reminders.insuranceRenewal) {
      const dueDate = new Date(formData.vehicleData.reminders.insuranceRenewal)
      if (dueDate <= thirtyDaysFromNow) {
        reminders.push({ 
          type: 'Insurance Renewal', 
          date: dueDate.toLocaleDateString(),
          urgent: dueDate <= now 
        })
      }
    }

    if (formData.vehicleData.reminders.taxDue) {
      const dueDate = new Date(formData.vehicleData.reminders.taxDue)
      if (dueDate <= thirtyDaysFromNow) {
        reminders.push({ 
          type: 'Road Tax', 
          date: dueDate.toLocaleDateString(),
          urgent: dueDate <= now 
        })
      }
    }

    return reminders
  }

  const getCoverPhoto = () => {
    return formData.photos.find(p => p.isCover)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Publish</h2>
        <p className="text-muted-foreground">
          Review all the details before adding this vehicle to your family archive.
        </p>
      </div>

      {/* Vehicle Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {formData.title}
          </CardTitle>
          <CardDescription>{getVehicleDisplayName()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Cover Photo */}
            <div className="md:col-span-1">
              {getCoverPhoto() ? (
                <div className="relative">
                  <img
                    src={getCoverPhoto()?.preview}
                    alt="Vehicle cover"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Badge className="absolute top-2 left-2">
                    Cover Photo
                  </Badge>
                </div>
              ) : (
                <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No cover photo</p>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{formData.vehicleData.specs.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Color</p>
                  <p className="font-medium">{formData.vehicleData.specs.color || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fuel/Power</p>
                  <p className="font-medium capitalize">{formData.vehicleData.specs.fuel || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registration</p>
                  <p className="font-medium">
                    {formData.vehicleData.identifiers.plate?.number || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Odometer</p>
                  <p className="font-medium">
                    {formData.vehicleData.metrics.odometer?.value 
                      ? `${formData.vehicleData.metrics.odometer.value.toLocaleString()} ${formData.vehicleData.metrics.odometer.unit}`
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="secondary" className="capitalize">
                    {formData.vehicleData.status || 'on-road'}
                  </Badge>
                </div>
              </div>

              {/* Photos & Documents Count */}
              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Camera className="h-4 w-4" />
                  <span>{formData.photos.length} photos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>{formData.documents.length} documents</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminders */}
      {getUpcomingReminders().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Upcoming Reminders
            </CardTitle>
            <CardDescription>
              Important dates and deadlines for this vehicle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getUpcomingReminders().map((reminder, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{reminder.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{reminder.date}</span>
                    <Badge variant={reminder.urgent ? "destructive" : "secondary"}>
                      {reminder.urgent ? 'Overdue' : 'Due Soon'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Summary */}
      {(formData.vehicleData.maintenance.lastServiceDate || 
        formData.vehicleData.maintenance.nextServiceDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {formData.vehicleData.maintenance.lastServiceDate && (
                <div>
                  <p className="text-muted-foreground">Last Service</p>
                  <p className="font-medium">
                    {new Date(formData.vehicleData.maintenance.lastServiceDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {formData.vehicleData.maintenance.nextServiceDate && (
                <div>
                  <p className="text-muted-foreground">Next Service Due</p>
                  <p className="font-medium">
                    {new Date(formData.vehicleData.maintenance.nextServiceDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            
            {formData.vehicleData.accessories && formData.vehicleData.accessories.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Accessories</p>
                <div className="flex flex-wrap gap-1">
                  {formData.vehicleData.accessories.map((accessory) => (
                    <Badge key={accessory} variant="outline" className="text-xs">
                      {accessory}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location */}
      {formData.vehicleData.location.propertyId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Storage Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="text-muted-foreground">Stored at: </span>
              <span className="font-medium">
                {formData.vehicleData.location.roomOrSpace || 'Property location'}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Add any extra information about this vehicle (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Any additional details, history, or special notes about this vehicle..."
              rows={4}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visibility Reminder */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Visibility: {formData.visibility}</p>
              <p className="text-sm text-muted-foreground">
                {formData.visibility === 'family' && 'All family members can see this vehicle'}
                {formData.visibility === 'branch' && 'Only your branch can see this vehicle'}
                {formData.visibility === 'private' && 'Only you can see this vehicle'}
              </p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {formData.visibility}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <Button
          size="lg"
          onClick={onPublish}
          disabled={!formData.title}
          className="px-8"
        >
          Publish Vehicle
        </Button>
      </div>
    </div>
  )
}