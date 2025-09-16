import { Button } from '@/components/ui/button'
import { ElderPrompt, truncatePrompt } from '@/lib/prompts/getElderPrompts'

interface PromptChipProps {
  prompt: ElderPrompt
  onRecord: (prompt: ElderPrompt) => void
}

export function PromptChip({ prompt, onRecord }: PromptChipProps) {
  return (
    <Button
      onClick={() => onRecord(prompt)}
      variant="outline"
      size="lg"
      className="h-11 px-4 text-sm font-medium flex-1 text-left justify-start min-w-0 bg-background hover:bg-accent/50 border-2"
    >
      <span className="truncate">
        {truncatePrompt(prompt.text, 60)}
      </span>
    </Button>
  )
}