import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image, Video } from 'lucide-react'

interface MediaUploaderProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export default function MediaUploader({ 
  onFilesSelected, 
  maxFiles = 5,
  acceptedTypes = ['image/*', 'video/*']
}: MediaUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      return acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
      })
    })

    const newFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={selectedFiles.length >= maxFiles}
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Choose Files</span>
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedFiles.length}/{maxFiles} files selected
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {selectedFiles.map((file, index) => (
            <Card key={index} className="p-3">
              <CardContent className="p-0 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <Image className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Video className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {selectedFiles.map((file, index) => {
            if (file.type.startsWith('image/')) {
              const url = URL.createObjectURL(file)
              return (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={file.name}
                    className="w-full h-24 object-cover rounded-lg"
                    onLoad={() => URL.revokeObjectURL(url)}
                  />
                </div>
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}