import { Button } from '@/components/ui/button'
import { ElderPrompt, truncatePrompt } from '@/lib/prompts/getElderPrompts'
import { ListenButton } from '@/components/prompts/ListenButton'

interface PromptChipProps {
  prompt: ElderPrompt
  onRecord: (prompt: ElderPrompt) => void
}

export function PromptChip({ prompt, onRecord }: PromptChipProps) {
  return (
    <div className="flex gap-2 flex-1 min-w-0">
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
      <ListenButton
        text={prompt.text}
        promptId={prompt.id}
        size="lg"
        className="h-11 w-11 p-0 shrink-0"
      />
    </div>
  )
}