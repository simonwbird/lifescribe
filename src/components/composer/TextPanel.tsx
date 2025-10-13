import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SaveStatusBadge } from './SaveStatusBadge'
import { useSaveStatus } from '@/hooks/useSaveStatus'

interface TextPanelProps {
  title: string
  content: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onBlur?: () => void
}

export function TextPanel({
  title,
  content,
  onTitleChange,
  onContentChange,
  onBlur
}: TextPanelProps) {
  const saveStatus = useSaveStatus([title, content], 10000)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Write Your Story</h2>
        <SaveStatusBadge status={saveStatus} />
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          ref={titleRef}
          id="title"
          placeholder="Give your story a title..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onBlur}
          maxLength={200}
          className="text-lg"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          Story <span className="text-destructive">*</span>
        </label>
        <Textarea
          ref={contentRef}
          id="content"
          placeholder="Tell your story..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onBlur={onBlur}
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
