import React, { useState } from 'react'
import { Camera, Upload, Check, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { 
  VehicleFormData, 
  VehiclePhoto, 
  VehicleDocument,
  VehiclePhotoCategory,
  VehicleDocumentType 
} from '@/lib/vehicleTypes'
import { PHOTO_CHECKLIST } from '@/lib/vehicleTypes'

interface VehicleWizardStep3Props {
  formData: VehicleFormData
  onUpdate: (updates: Partial<VehicleFormData>) => void
}

const documentTypes: { value: VehicleDocumentType; label: string; description: string }[] = [
  { value: 'logbook', label: 'Logbook/Title', description: 'Vehicle registration document' },
  { value: 'insurance', label: 'Insurance Certificate', description: 'Current insurance policy' },
  { value: 'service-history', label: 'Service History', description: 'Service records and receipts' },
  { value: 'inspection-cert', label: 'MOT/Inspection', description: 'Safety inspection certificate' },
  { value: 'tax-receipt', label: 'Road Tax/Registration', description: 'Tax payment receipt' },
  { value: 'warranty', label: 'Warranty', description: 'Manufacturer or extended warranty' }
]

export default function VehicleWizardStep3({
  formData,
  onUpdate
}: VehicleWizardStep3Props) {
  const [activePhotoCategory, setActivePhotoCategory] = useState<VehiclePhotoCategory>('front')

  const addPhoto = (file: File, category: VehiclePhotoCategory) => {
    const newPhoto: VehiclePhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      file,
      category,
      isCover: formData.photos.length === 0, // First photo is cover
      order: formData.photos.length,
      preview: URL.createObjectURL(file)
    }

    onUpdate({ 
      photos: [...formData.photos, newPhoto] 
    })
  }

  const removePhoto = (photoId: string) => {
    const updatedPhotos = formData.photos.filter(p => p.id !== photoId)
    // If we removed the cover photo, make the first remaining photo the cover
    if (updatedPhotos.length > 0 && !updatedPhotos.some(p => p.isCover)) {
      updatedPhotos[0].isCover = true
    }
    onUpdate({ photos: updatedPhotos })
  }

  const setCoverPhoto = (photoId: string) => {
    const updatedPhotos = formData.photos.map(p => ({
      ...p,
      isCover: p.id === photoId
    }))
    onUpdate({ photos: updatedPhotos })
  }

  const addDocument = (file: File, type: VehicleDocumentType) => {
    const newDocument: VehicleDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      file,
      type,
      name: file.name
    }

    onUpdate({ 
      documents: [...formData.documents, newDocument] 
    })
  }

  const removeDocument = (documentId: string) => {
    onUpdate({ 
      documents: formData.documents.filter(d => d.id !== documentId) 
    })
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        addPhoto(file, activePhotoCategory)
      })
    }
    event.target.value = '' // Reset input
  }

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>, type: VehicleDocumentType) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        addDocument(file, type)
      })
    }
    event.target.value = '' // Reset input
  }

  const getPhotosForCategory = (category: VehiclePhotoCategory) => {
    return formData.photos.filter(p => p.category === category)
  }

  const getCategoryCompletion = () => {
    const completed = PHOTO_CHECKLIST.filter(item => 
      getPhotosForCategory(item.category).length > 0
    ).length
    return `${completed}/${PHOTO_CHECKLIST.length}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Photos & Documents</h2>
        <p className="text-muted-foreground">
          Capture comprehensive photos and upload important documents for your vehicle.
        </p>
      </div>

      <Tabs defaultValue="photos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photos ({formData.photos.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Documents ({formData.documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="space-y-6">
          {/* Photo Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Photo Checklist
                <Badge variant="secondary">{getCategoryCompletion()} Complete</Badge>
              </CardTitle>
              <CardDescription>
                Follow this checklist to capture comprehensive photos of your vehicle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PHOTO_CHECKLIST.map((item) => {
                  const photos = getPhotosForCategory(item.category)
                  const isCompleted = photos.length > 0
                  
                  return (
                    <Button
                      key={item.category}
                      variant={activePhotoCategory === item.category ? "default" : "outline"}
                      className={cn(
                        "h-auto p-3 flex flex-col items-center gap-2",
                        isCompleted && "border-green-500"
                      )}
                      onClick={() => setActivePhotoCategory(item.category)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium">{item.label}</span>
                        {isCompleted && <Check className="h-4 w-4 text-green-600" />}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {photos.length} photos
                      </Badge>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Category Upload */}
          <Card>
            <CardHeader>
              <CardTitle>
                {PHOTO_CHECKLIST.find(c => c.category === activePhotoCategory)?.label} Photos
              </CardTitle>
              <CardDescription>
                Upload photos for this category. You can add multiple photos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <span className="text-sm font-medium">Take Photo or Upload</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG up to 10MB each
                      </p>
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Existing Photos for Category */}
                {getPhotosForCategory(activePhotoCategory).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getPhotosForCategory(activePhotoCategory).map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.preview}
                          alt={`${photo.category} photo`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          {!photo.isCover && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setCoverPhoto(photo.id)}
                            >
                              Set Cover
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removePhoto(photo.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {photo.isCover && (
                          <Badge className="absolute top-2 left-2">
                            Cover
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid gap-6">
            {documentTypes.map((docType) => {
              const existingDocs = formData.documents.filter(d => d.type === docType.value)
              
              return (
                <Card key={docType.value}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {docType.label}
                      {existingDocs.length > 0 && (
                        <Badge variant="secondary">{existingDocs.length} files</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{docType.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Upload Area */}
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                        <div className="flex flex-col items-center justify-center text-center">
                          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                          <Label 
                            htmlFor={`doc-upload-${docType.value}`} 
                            className="cursor-pointer"
                          >
                            <span className="text-sm font-medium">Upload {docType.label}</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              PDF, JPG, PNG up to 10MB
                            </p>
                          </Label>
                          <Input
                            id={`doc-upload-${docType.value}`}
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            onChange={(e) => handleDocumentUpload(e, docType.value)}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* Existing Documents */}
                      {existingDocs.length > 0 && (
                        <div className="space-y-2">
                          {existingDocs.map((doc) => (
                            <div 
                              key={doc.id} 
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(doc.file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeDocument(doc.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
