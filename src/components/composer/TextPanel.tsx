import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface TextPanelProps {
  title: string
  content: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
}

export function TextPanel({
  title,
  content,
  onTitleChange,
  onContentChange
}: TextPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          placeholder="Give your story a title..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={200}
          className="text-lg"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          Story <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="content"
          placeholder="Tell your story..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={20}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground mt-2">
          {content.length} characters
        </p>
      </div>
    </div>
  )
}
