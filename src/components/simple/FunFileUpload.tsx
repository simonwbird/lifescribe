import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Image, 
  Video, 
  Music, 
  X, 
  FileCheck, 
  Sparkles,
  Camera,
  Mic,
  Film
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { 
  validateFiles, 
  formatFileSize, 
  getFileCategory,
  generateAcceptAttribute 
} from '@/utils/fileValidation'

interface FunFileUploadProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  allowedTypes?: ('images' | 'videos' | 'audio')[]
  className?: string
}

export default function FunFileUpload({ 
  onFilesSelected, 
  maxFiles = 10, 
  allowedTypes = ['images', 'videos', 'audio'],
  className 
}: FunFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const acceptAttribute = generateAcceptAttribute(allowedTypes)

  const getFileIcon = (file: File) => {
    const category = getFileCategory(file.type)
    switch (category) {
      case 'image': return <Image className="w-5 h-5 text-blue-500" />
      case 'video': return <Video className="w-5 h-5 text-purple-500" />
      case 'audio': return <Music className="w-5 h-5 text-green-500" />
      default: return <FileCheck className="w-5 h-5 text-gray-500" />
    }
  }

  const getUploadAreaIcon = () => {
    if (allowedTypes.includes('images') && allowedTypes.includes('videos')) {
      return <Camera className="w-12 h-12 text-primary animate-bounce" />
    } else if (allowedTypes.includes('videos')) {
      return <Film className="w-12 h-12 text-primary animate-bounce" />
    } else if (allowedTypes.includes('audio')) {
      return <Mic className="w-12 h-12 text-primary animate-bounce" />
    }
    return <Upload className="w-12 h-12 text-primary animate-bounce" />
  }

  const handleFiles = useCallback((files: FileList) => {
    const { validFiles, invalidFiles, warnings } = validateFiles(files)

    if (selectedFiles.length + validFiles.length > maxFiles) {
      toast({
        title: "Whoa there! 🚫",
        description: `You can only upload ${maxFiles} files at once. Remove some first!`,
        variant: "destructive",
      })
      return
    }

    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, error }) => {
        toast({
          title: `Oops! ${file.name} 😅`,
          description: error,
          variant: "destructive",
        })
      })
    }

    if (warnings.length > 0) {
      warnings.forEach(warning => {
        toast({
          title: "Heads up! ⚠️",
          description: warning,
          variant: "default",
        })
      })
    }

    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles]
      setSelectedFiles(newFiles)
      onFilesSelected(newFiles)

      // Simulate upload progress with fun animations
      validFiles.forEach((file, index) => {
        const fileId = `${file.name}-${Date.now()}-${index}`
        let progress = 0
        const interval = setInterval(() => {
          progress += Math.random() * 15 + 5
          if (progress >= 100) {
            progress = 100
            clearInterval(interval)
            // Trigger success confetti
            triggerFileSuccessAnimation()
          }
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
        }, 200)
      })

      toast({
        title: `Awesome! 🎉`,
        description: `Added ${validFiles.length} file${validFiles.length > 1 ? 's' : ''}!`,
      })
    }
  }, [selectedFiles, maxFiles, onFilesSelected, toast])

  const triggerFileSuccessAnimation = () => {
    import('canvas-confetti').then(confetti => {
      confetti.default({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7']
      })
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
      // Reset input to allow same file selection
      e.target.value = ''
    }
  }, [handleFiles])

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
    
    toast({
      title: "File removed! 🗑️",
      description: "No worries, you can always add more!",
    })
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const getTypeHint = () => {
    const types = []
    if (allowedTypes.includes('images')) types.push('📸 Photos')
    if (allowedTypes.includes('videos')) types.push('🎬 Videos') 
    if (allowedTypes.includes('audio')) types.push('🎵 Audio')
    return types.join(', ')
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-300 cursor-pointer hover-scale",
          dragActive 
            ? "border-primary bg-primary/10 scale-105 shadow-lg" 
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-fit">
            {getUploadAreaIcon()}
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {dragActive ? "Drop them here! 🎯" : "Add Your Files! ✨"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {getTypeHint()}
            </p>
          </div>

          {/* Fun Quick Actions */}
          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                openFileDialog()
              }}
              className="hover-scale bg-blue-50 hover:bg-blue-100 border-blue-200"
            >
              <Camera className="w-4 h-4 mr-1" />
              Photos
            </Button>
            {allowedTypes.includes('videos') && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openFileDialog()
                }}
                className="hover-scale bg-purple-50 hover:bg-purple-100 border-purple-200"
              >
                <Film className="w-4 h-4 mr-1" />
                Videos
              </Button>
            )}
            {allowedTypes.includes('audio') && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openFileDialog()
                }}
                className="hover-scale bg-green-50 hover:bg-green-100 border-green-200"
              >
                <Music className="w-4 h-4 mr-1" />
                Audio
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Your Files ({selectedFiles.length}/{maxFiles})
              </h4>
              <Badge variant="outline" className="text-xs">
                Ready to share! 🎉
              </Badge>
            </div>
            
            <div className="space-y-2">
              {selectedFiles.map((file, index) => {
                const fileId = `${file.name}-${Date.now()}-${index}`
                const progress = uploadProgress[fileId] || 0
                const isComplete = progress >= 100
                
                return (
                  <div key={index} className="group">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="shrink-0">
                        {getFileIcon(file)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          {isComplete ? (
                            <Badge variant="secondary" className="h-4 text-xs bg-green-100 text-green-700">
                              ✅ Ready!
                            </Badge>
                          ) : (
                            <span>{Math.round(progress)}%</span>
                          )}
                        </div>
                        
                        {!isComplete && (
                          <Progress 
                            value={progress} 
                            className="h-1.5 mt-1 bg-muted" 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptAttribute}
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  )
}