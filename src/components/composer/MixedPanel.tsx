import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, GripVertical, X, Type, Image, Video, Mic, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContentBlock } from '@/hooks/useComposerState'
import { nanoid } from 'nanoid'
import { useToast } from '@/hooks/use-toast'

interface MixedPanelProps {
  title: string
  blocks: ContentBlock[]
  onTitleChange: (value: string) => void
  onBlocksChange: (blocks: ContentBlock[]) => void
  familyId: string
}

export function MixedPanel({ title, blocks, onTitleChange, onBlocksChange }: MixedPanelProps) {
  const { toast } = useToast()
  const [addBlockType, setAddBlockType] = useState<string>('')

  const videoCount = blocks.filter(b => b.type === 'video').length
  const audioCount = blocks.filter(b => b.type === 'audio').length

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return

    const items = Array.from(blocks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onBlocksChange(items)
  }

  function addBlock(type: string) {
    if (blocks.length >= 12) {
      toast({
        title: 'Block limit reached',
        description: 'You can add up to 12 blocks per story.',
        variant: 'destructive'
      })
      return
    }

    if (type === 'video' && videoCount >= 1) {
      toast({
        title: 'Video limit reached',
        description: 'You can add only 1 video per story.',
        variant: 'destructive'
      })
      return
    }

    if (type === 'audio' && audioCount >= 1) {
      toast({
        title: 'Audio limit reached',
        description: 'You can add only 1 audio recording per story.',
        variant: 'destructive'
      })
      return
    }

    let newBlock: ContentBlock
    const id = nanoid()

    switch (type) {
      case 'text':
        newBlock = { id, type: 'text', content: '' }
        break
      case 'divider':
        newBlock = { id, type: 'divider' }
        break
      default:
        return
    }

    onBlocksChange([...blocks, newBlock])
    setAddBlockType('')
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (blocks.length + files.length > 12) {
      toast({
        title: 'Block limit reached',
        description: 'You can add up to 12 blocks per story.',
        variant: 'destructive'
      })
      return
    }

    const newBlocks: ContentBlock[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const preview = URL.createObjectURL(file)
      newBlocks.push({
        id: nanoid(),
        type: 'image',
        file,
        preview
      })
    }

    onBlocksChange([...blocks, ...newBlocks])
  }

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (videoCount >= 1) {
      toast({
        title: 'Video limit reached',
        description: 'You can add only 1 video per story.',
        variant: 'destructive'
      })
      return
    }

    const url = URL.createObjectURL(file)
    const blob = file

    onBlocksChange([...blocks, {
      id: nanoid(),
      type: 'video',
      blob,
      url,
      thumbnail: null
    }])
  }

  function removeBlock(id: string) {
    onBlocksChange(blocks.filter(b => b.id !== id))
  }

  function updateTextBlock(id: string, content: string) {
    onBlocksChange(blocks.map(b =>
      b.id === id && b.type === 'text' ? { ...b, content } : b
    ))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <Input
          placeholder="Give your story a title..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-lg font-semibold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Content Blocks</label>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3 mb-4"
              >
                {blocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div {...provided.dragHandleProps} className="mt-2 cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1">
                            {block.type === 'text' && (
                              <Textarea
                                placeholder="Write your text..."
                                value={block.content}
                                onChange={(e) => updateTextBlock(block.id, e.target.value)}
                                className="min-h-[100px]"
                              />
                            )}
                            
                            {block.type === 'image' && (
                              <div className="relative">
                                <img
                                  src={block.preview}
                                  alt="Preview"
                                  className="w-full rounded-lg max-h-96 object-cover"
                                />
                                <span className="text-xs text-muted-foreground mt-2 block">
                                  {block.file.name}
                                </span>
                              </div>
                            )}
                            
                            {block.type === 'video' && (
                              <div className="relative">
                                <video
                                  src={block.url}
                                  controls
                                  className="w-full rounded-lg max-h-96"
                                />
                                <span className="text-xs text-muted-foreground mt-2 block">
                                  Video
                                </span>
                              </div>
                            )}
                            
                            {block.type === 'audio' && (
                              <div className="p-4 bg-secondary rounded-lg">
                                <audio src={block.url} controls className="w-full" />
                                {block.transcript && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Transcript: {block.transcript}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {block.type === 'divider' && (
                              <div className="py-4">
                                <hr className="border-t-2 border-border" />
                              </div>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBlock(block.id)}
                            className="shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {blocks.length === 0 && (
          <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">Add blocks to build your story</p>
          </div>
        )}

        <div className="space-y-2">
          <Select value={addBlockType} onValueChange={setAddBlockType}>
            <SelectTrigger>
              <SelectValue placeholder="Add a block..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <span>Text Block</span>
                </div>
              </SelectItem>
              <SelectItem value="image">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span>Image</span>
                </div>
              </SelectItem>
              <SelectItem value="video" disabled={videoCount >= 1}>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>Video {videoCount >= 1 && '(limit reached)'}</span>
                </div>
              </SelectItem>
              <SelectItem value="audio" disabled={audioCount >= 1}>
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  <span>Audio {audioCount >= 1 && '(limit reached)'}</span>
                </div>
              </SelectItem>
              <SelectItem value="divider">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4" />
                  <span>Divider</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {addBlockType === 'text' && (
            <Button onClick={() => addBlock('text')} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Text Block
            </Button>
          )}

          {addBlockType === 'image' && (
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Button asChild className="w-full">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Images
                </label>
              </Button>
            </div>
          )}

          {addBlockType === 'video' && videoCount < 1 && (
            <div>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
              />
              <Button asChild className="w-full">
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Video
                </label>
              </Button>
            </div>
          )}

          {addBlockType === 'divider' && (
            <Button onClick={() => addBlock('divider')} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Divider
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {blocks.length}/12 blocks • Video: {videoCount}/1 • Audio: {audioCount}/1
        </p>
      </div>
    </div>
  )
}