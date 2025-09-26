import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Camera, 
  Palette, 
  Upload,
  Heart,
  Star,
  Zap,
  Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useConfetti } from '@/hooks/useConfetti'
import EnhancedSimpleProfileCustomization from './EnhancedSimpleProfileCustomization'
import FunFileUpload from './FunFileUpload'
import DelightfulStickerBar from './DelightfulStickerBar'
import BouncyPromptShuffler from './BouncyPromptShuffler'

interface EnhancedSimpleModeProps {
  className?: string
}

export default function EnhancedSimpleMode({ className }: EnhancedSimpleModeProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState('create')
  const [celebrationCount, setCelebrationCount] = useState(0)
  const { toast } = useToast()
  const { celebratePost, fireworks, hearts } = useConfetti()

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
    if (files.length > 0) {
      toast({
        title: `Awesome! 📸`,
        description: `${files.length} file${files.length > 1 ? 's' : ''} ready to share!`,
      })
    }
  }

  const handlePromptSelect = (prompt: string) => {
    toast({
      title: "Great choice! ✨",
      description: "Ready to share your story!",
    })
    celebratePost()
  }

  const triggerSurpriseAnimation = () => {
    setCelebrationCount(prev => prev + 1)
    
    if (celebrationCount % 3 === 0) {
      fireworks()
    } else if (celebrationCount % 2 === 0) {
      hearts()
    } else {
      celebratePost()
    }
    
    toast({
      title: "Surprise! 🎉",
      description: "You found the secret celebration button!",
    })
  }

  return (
    <div className={cn("space-y-6 max-w-4xl mx-auto p-4", className)}>
      {/* Welcome Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                <Star className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500 animate-bounce" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to Your Fun Zone! ✨
                </CardTitle>
                <p className="text-sm text-muted-foreground font-medium">
                  Share, create, and connect with your family in the most delightful way! 🌟
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={triggerSurpriseAnimation}
              className="hover-scale hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100"
            >
              <Gift className="w-5 h-5 text-purple-500" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-pink-100 to-purple-100 p-1 rounded-xl">
          <TabsTrigger 
            value="create" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 hover-scale font-medium"
          >
            <Camera className="w-4 h-4 mr-2" />
            Create & Share
          </TabsTrigger>
          <TabsTrigger 
            value="upload" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 hover-scale font-medium"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger 
            value="customize" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 hover-scale font-medium"
          >
            <Palette className="w-4 h-4 mr-2" />
            Customize
          </TabsTrigger>
          <TabsTrigger 
            value="reactions" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 hover-scale font-medium"
          >
            <Heart className="w-4 h-4 mr-2" />
            Reactions
          </TabsTrigger>
        </TabsList>

        {/* Create & Share Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Story Prompts & Ideas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BouncyPromptShuffler onPromptSelect={handlePromptSelect} />
            </CardContent>
          </Card>

          {/* Quick File Upload in Create Tab */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-green-500" />
                Quick Photo & Video Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FunFileUpload 
                onFilesSelected={handleFilesSelected}
                maxFiles={5}
                allowedTypes={['images', 'videos']}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Files Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-500" />
                Upload All Your Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FunFileUpload 
                onFilesSelected={handleFilesSelected}
                maxFiles={10}
                allowedTypes={['images', 'videos', 'audio']}
              />
              
              {selectedFiles.length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-white/50">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {selectedFiles.length} files ready!
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your files are ready to share with the family! 🎉
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customize Tab */}
        <TabsContent value="customize" className="space-y-6">
          <EnhancedSimpleProfileCustomization />
        </TabsContent>

        {/* Reactions Tab */}
        <TabsContent value="reactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Fun Reactions & Stickers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border-2 border-dashed border-pink-200">
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <Sparkles className="w-12 h-12 text-pink-500 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-bold text-pink-700">
                      React to Family Posts!
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Use our amazing sticker collection to react to family stories, photos, and memories. 
                      Every reaction spreads joy! ✨
                    </p>
                  </div>
                </div>

                {/* Demo Sticker Bar */}
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-sm font-medium mb-3">Try our reaction stickers:</p>
                  <DelightfulStickerBar 
                    targetType="story" 
                    targetId="demo-story" 
                    familyId="demo-family" 
                  />
                </div>

                {/* Features List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-700 mb-2">🎭 Express Yourself</h4>
                    <p className="text-sm text-blue-600">
                      Over 50+ fun stickers and emojis to show how you feel!
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <h4 className="font-bold text-green-700 mb-2">✨ Magical Effects</h4>
                    <p className="text-sm text-green-600">
                      Each reaction triggers delightful animations and confetti!
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <h4 className="font-bold text-purple-700 mb-2">👨‍👩‍👧‍👦 Family Fun</h4>
                    <p className="text-sm text-purple-600">
                      See what reactions your family members love most!
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <h4 className="font-bold text-yellow-700 mb-2">🏆 Achievement</h4>
                    <p className="text-sm text-yellow-600">
                      Unlock special effects the more you react and engage!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fun Footer Stats */}
      {celebrationCount > 0 && (
        <Card className="border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-4 text-center">
            <Badge variant="outline" className="bg-white/50 border-yellow-300">
              <Star className="w-3 h-3 mr-1 text-yellow-500" />
              Celebration Count: {celebrationCount} 
              {celebrationCount >= 10 && " 🎉 Party Master!"}
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  )
}