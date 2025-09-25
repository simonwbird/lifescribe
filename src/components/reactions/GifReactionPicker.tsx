import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Smile, Search, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GifReactionPickerProps {
  onReactionSelect: (type: string, url?: string) => void
  className?: string
}

// Curated sticker reactions for teens/kids
const stickerReactions = [
  { type: 'thumbs_up_sticker', emoji: '👍', label: 'Awesome!' },
  { type: 'heart_eyes_sticker', emoji: '😍', label: 'Love it!' },
  { type: 'fire_sticker', emoji: '🔥', label: 'So cool!' },
  { type: 'laughing_sticker', emoji: '😂', label: 'LOL!' },
  { type: 'mind_blown_sticker', emoji: '🤯', label: 'OMG!' },
  { type: 'party_sticker', emoji: '🎉', label: 'YES!' },
  { type: 'rainbow_sticker', emoji: '🌈', label: 'Beautiful!' },
  { type: 'sparkles_sticker', emoji: '✨', label: 'Amazing!' },
  { type: 'unicorn_sticker', emoji: '🦄', label: 'Magical!' },
  { type: 'rocket_sticker', emoji: '🚀', label: 'Epic!' },
]

// Popular GIF categories for teens/kids (placeholder data)
const popularGifs = [
  { id: 'celebration', url: 'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif', alt: 'Celebration' },
  { id: 'excited', url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif', alt: 'Excited' },
  { id: 'thumbs-up', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif', alt: 'Thumbs up' },
  { id: 'love', url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif', alt: 'Love' },
  { id: 'funny', url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', alt: 'Funny' },
  { id: 'wow', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', alt: 'Wow' },
]

export default function GifReactionPicker({ onReactionSelect, className }: GifReactionPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)

  const handleReactionSelect = (type: string, url?: string) => {
    onReactionSelect(type, url)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0 hover:bg-primary/10", className)}
          title="Add fun reaction"
        >
          <Smile className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        <Tabs defaultValue="stickers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stickers" className="flex items-center gap-2">
              <Smile className="w-4 h-4" />
              Stickers
            </TabsTrigger>
            <TabsTrigger value="gifs" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              GIFs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stickers" className="p-4 space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-3">Express yourself!</h4>
              <div className="grid grid-cols-3 gap-2">
                {stickerReactions.map(({ type, emoji, label }) => (
                  <Button
                    key={type}
                    variant="ghost"
                    onClick={() => handleReactionSelect(type)}
                    className="flex flex-col items-center gap-1 h-auto p-3 hover:bg-primary/10 border-2 border-transparent hover:border-primary/20 transition-all"
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-xs font-medium text-center leading-tight">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="gifs" className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for GIFs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-3">Popular reactions</h4>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {popularGifs.map((gif) => (
                  <Button
                    key={gif.id}
                    variant="ghost"
                    onClick={() => handleReactionSelect(`gif_${gif.id}`, gif.url)}
                    className="h-auto p-2 hover:bg-primary/10 border-2 border-transparent hover:border-primary/20 transition-all"
                  >
                    <img
                      src={gif.url}
                      alt={gif.alt}
                      className="w-full h-16 object-cover rounded"
                    />
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}