import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Settings, Mic, Users } from 'lucide-react'

interface ModeSelectionProps {
  onModeSelected: (mode: 'simple' | 'studio') => void
  familyName?: string
}

export default function ModeSelection({ onModeSelected, familyName }: ModeSelectionProps) {
  // Default to Simple mode now
  const handleSimpleMode = () => onModeSelected('simple')
  const handleStudioMode = () => onModeSelected('studio')
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to {familyName}!</CardTitle>
          <CardDescription className="text-lg">
            We recommend <strong>Simple Mode</strong> for the best experience. Studio Mode is available but being phased out.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Simple Mode */}
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                  <Eye className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Simple Mode</CardTitle>
                <Badge variant="secondary" className="mx-auto bg-green-100 text-green-800 border-green-200">Recommended</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Large, easy-to-read text and buttons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Voice-first interface for recording memories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Streamlined, distraction-free experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Perfect for quick story sharing</span>
                  </li>
                </ul>
                
                <Button 
                  onClick={() => onModeSelected('simple')} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Choose Simple Mode
                </Button>
              </CardContent>
            </Card>

            {/* Studio Mode */}
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Studio Mode</CardTitle>
                <Badge variant="outline" className="mx-auto border-orange-200 text-orange-700">Legacy</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Advanced family tree editing and tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Recipe collections and property tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Media management and organizing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>All capture modes (voice, photo, video)</span>
                  </li>
                </ul>
                
                <Button 
                  onClick={() => onModeSelected('studio')} 
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Choose Studio Mode
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>You can change this setting anytime in Labs (Studio Mode is experimental)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}