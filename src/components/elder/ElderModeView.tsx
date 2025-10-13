import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, Camera, Volume2, Phone, MessageSquare } from 'lucide-react'
import { VoiceCapture } from '@/components/home/VoiceCapture'
import { useToast } from '@/hooks/use-toast'

interface ElderModeViewProps {
  userId: string
  familyId: string
  phoneCode: string
}

export default function ElderModeView({ userId, familyId, phoneCode }: ElderModeViewProps) {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleAddPhoto = () => {
    navigate('/capture?type=photo')
  }

  const handleListenToFamily = () => {
    navigate('/feed')
  }

  const copyPhoneCode = () => {
    navigator.clipboard.writeText(phoneCode)
    toast({
      title: "Code Copied!",
      description: `Your phone code ${phoneCode} has been copied`,
    })
  }

  if (showVoiceRecorder) {
    return (
      <div className="min-h-screen bg-background p-8">
        <VoiceCapture
          familyId={familyId}
          userId={userId}
          onPublished={() => {
            setShowVoiceRecorder(false)
            toast({
              title: "Recording Saved!",
              description: "Your voice note has been saved",
            })
          }}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-12">
        <h1 className="text-6xl font-bold mb-4 text-center">Welcome!</h1>
        <p className="text-3xl text-muted-foreground text-center">
          Choose what you'd like to do
        </p>
      </div>

      {/* Main Actions */}
      <div className="max-w-5xl mx-auto grid gap-8 mb-12">
        {/* Start Recording */}
        <Card 
          className="p-12 cursor-pointer hover:shadow-xl transition-shadow border-4"
          onClick={() => setShowVoiceRecorder(true)}
        >
          <div className="flex items-center gap-8">
            <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mic className="h-16 w-16 text-primary" />
            </div>
            <div>
              <h2 className="text-5xl font-bold mb-3">Start Recording</h2>
              <p className="text-2xl text-muted-foreground">
                Share your stories and memories
              </p>
            </div>
          </div>
        </Card>

        {/* Add Photo */}
        <Card 
          className="p-12 cursor-pointer hover:shadow-xl transition-shadow border-4"
          onClick={handleAddPhoto}
        >
          <div className="flex items-center gap-8">
            <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Camera className="h-16 w-16 text-primary" />
            </div>
            <div>
              <h2 className="text-5xl font-bold mb-3">Add Photo</h2>
              <p className="text-2xl text-muted-foreground">
                Capture and share precious moments
              </p>
            </div>
          </div>
        </Card>

        {/* Listen to Family */}
        <Card 
          className="p-12 cursor-pointer hover:shadow-xl transition-shadow border-4"
          onClick={handleListenToFamily}
        >
          <div className="flex items-center gap-8">
            <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Volume2 className="h-16 w-16 text-primary" />
            </div>
            <div>
              <h2 className="text-5xl font-bold mb-3">Listen to Family</h2>
              <p className="text-2xl text-muted-foreground">
                Hear stories from your loved ones
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Phone Instructions */}
      <Card className="max-w-5xl mx-auto p-8 bg-primary/5 border-primary/20">
        <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Phone className="h-8 w-8" />
          Call In Anytime
        </h3>
        <div className="space-y-4 text-xl">
          <div className="flex items-start gap-3">
            <span className="font-bold text-2xl text-primary">1.</span>
            <p>Call our voice message line: <strong className="text-2xl">(555) 123-4567</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold text-2xl text-primary">2.</span>
            <div>
              <p>When prompted, enter your code:</p>
              <Button 
                onClick={copyPhoneCode}
                variant="outline" 
                size="lg"
                className="mt-2 text-4xl font-bold h-20 px-8"
              >
                {phoneCode}
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold text-2xl text-primary">3.</span>
            <p>Leave your message after the beep!</p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-primary/20">
          <h4 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <MessageSquare className="h-7 w-7" />
            Or Send a WhatsApp
          </h4>
          <p className="text-xl">
            Send voice messages to: <strong className="text-2xl">+1 (555) 123-4567</strong>
            <br />
            <span className="text-muted-foreground">Include your code {phoneCode} in the first message</span>
          </p>
        </div>
      </Card>
    </div>
  )
}