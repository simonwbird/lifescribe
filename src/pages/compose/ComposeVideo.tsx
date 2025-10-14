import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Video, Upload, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Header from '@/components/Header'
import type { ComposerPrefillData } from '@/pages/stories/StoryNew'

interface ComposeVideoProps {
  prefillData?: ComposerPrefillData
  standalone?: boolean
}

export default function ComposeVideo({ prefillData, standalone = true }: ComposeVideoProps) {
  const navigate = useNavigate()
  const [activeCamera, setActiveCamera] = useState<'front' | 'back'>('back')

  const content_ui = (
    <Card>
          <CardHeader>
            <CardTitle>Video Recording</CardTitle>
            <CardDescription>
              Record a video or upload an existing one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="record">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="record">Record</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="record" className="space-y-4 mt-4">
                <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-4 bg-muted/20">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium mb-1">Camera preview</p>
                    <p className="text-sm text-muted-foreground">
                      Click below to start recording
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant={activeCamera === 'back' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setActiveCamera('back')}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Back Camera
                  </Button>
                  <Button 
                    variant={activeCamera === 'front' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setActiveCamera('front')}
                  >
                    <Camera className="h-4 w-4 mr-2 scale-x-[-1]" />
                    Front Camera
                  </Button>
                </div>

                <Button className="w-full h-12">
                  Start Recording
                </Button>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4 mt-4">
                <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium mb-1">Upload a video</p>
                    <p className="text-sm text-muted-foreground">
                      Select a video file from your device
                    </p>
                  </div>
                  <Button variant="outline">
                    Browse Files
                  </Button>
                </div>

                <div className="bg-muted rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Supported formats:</p>
                  <p className="text-muted-foreground">
                    MP4, MOV, AVI, WebM (max 500MB)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
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
          <h1 className="text-3xl font-bold mb-2">Record Video</h1>
          <p className="text-muted-foreground">
            Capture a short video memory or moment
          </p>
        </div>
        {content_ui}
      </main>
    </div>
  )
}
