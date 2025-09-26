import React from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '@/components/Header'
import { CaptureModeTiles } from '@/components/capture/CaptureModeTiles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Capture() {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')

  return (
    <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  {mode ? `${mode.charAt(0).toUpperCase() + mode.slice(1)} Capture` : 'Quick Capture'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <CaptureModeTiles className="max-w-md mx-auto" />
              </CardContent>
            </Card>
          </div>
         </main>
       </div>
     )
   }