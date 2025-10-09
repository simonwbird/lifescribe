import { Play, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AudioConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  audioBlob: Blob | null
  onKeep: () => void
  onDiscard: () => void
  title?: string
  description?: string
}

export function AudioConfirmDialog({
  open,
  onOpenChange,
  audioBlob,
  onKeep,
  onDiscard,
  title = "Keep this recording?",
  description = "Listen to your recording and decide if you want to keep it."
}: AudioConfirmDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlay = () => {
    if (!audioBlob) return

    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    const url = URL.createObjectURL(audioBlob)
    audioRef.current = new Audio(url)
    audioRef.current.play()
    setIsPlaying(true)

    audioRef.current.onended = () => {
      setIsPlaying(false)
      URL.revokeObjectURL(url)
    }
  }

  const handleDiscard = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    onDiscard()
  }

  const handleKeep = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    onKeep()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-6">
          <Button
            size="lg"
            variant="outline"
            onClick={handlePlay}
            className={cn(
              "h-20 w-20 rounded-full",
              isPlaying && "bg-primary/10 border-primary"
            )}
          >
            <Play className={cn(
              "h-8 w-8",
              isPlaying && "text-primary"
            )} />
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            variant="outline"
            onClick={handleDiscard}
            className="w-full gap-2 text-base h-14"
          >
            <Trash2 className="h-5 w-5" />
            Try Again
          </Button>
          <Button
            size="lg"
            onClick={handleKeep}
            className="w-full gap-2 text-base h-14"
          >
            <Check className="h-5 w-5" />
            Keep Recording
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
