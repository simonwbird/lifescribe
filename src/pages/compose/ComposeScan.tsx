import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ScanLine, Camera, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'

export default function ComposeScan() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Scan Old Photo</h1>
          <p className="text-muted-foreground">
            Digitize your physical photographs with enhanced quality
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Photo Scanner</CardTitle>
            <CardDescription>
              Use your camera to capture and enhance old photos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-4">
              <ScanLine className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium mb-1">Scan a physical photo</p>
                <p className="text-sm text-muted-foreground">
                  Position the photo in good lighting for best results
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <Button className="w-full h-16">
                <Camera className="h-5 w-5 mr-2" />
                Open Camera Scanner
              </Button>
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Already Scanned Photo
              </Button>
            </div>

            <div className="bg-muted rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Tips for best results:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Use natural daylight when possible</li>
                <li>• Place photo on a flat, contrasting surface</li>
                <li>• Keep camera parallel to the photo</li>
                <li>• Avoid shadows and glare</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
