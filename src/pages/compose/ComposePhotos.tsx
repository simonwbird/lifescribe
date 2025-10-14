import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import type { ComposerPrefillData } from '@/pages/stories/StoryNew'

interface ComposePhotosProps {
  prefillData?: ComposerPrefillData
  standalone?: boolean
}

export default function ComposePhotos({ prefillData, standalone = true }: ComposePhotosProps) {
  const navigate = useNavigate()

  const content_ui = (
    <Card>
          <CardHeader>
            <CardTitle>Select Photos</CardTitle>
            <CardDescription>
              Upload photos from your device or take a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium mb-1">Drag and drop photos here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <Button variant="outline">
                Browse Files
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t" />
              <span className="text-sm text-muted-foreground">OR</span>
              <div className="flex-1 border-t" />
            </div>

            <Button variant="outline" className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Take Photo with Camera
            </Button>
          </CardContent>
        </Card>
  )

  if (!standalone) {
    return content_ui
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Upload Photos</h1>
          <p className="text-muted-foreground">
            Add one or more photos to your family archive
          </p>
        </div>
        {content_ui}
      </main>
    </div>
  )
}
