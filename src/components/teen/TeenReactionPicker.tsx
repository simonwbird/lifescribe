import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TeenReactionPickerProps {
  onReactionSelect: (type: string) => void;
  className?: string;
}

const teenReactions = [
  { type: 'heart', emoji: '❤️', label: 'Love', color: 'hover:bg-red-500/10' },
  { type: 'laugh', emoji: '😂', label: 'Haha', color: 'hover:bg-yellow-500/10' },
  { type: 'thumbs_up', emoji: '👍', label: 'Like', color: 'hover:bg-blue-500/10' },
  { type: 'party', emoji: '🎉', label: 'Celebrate', color: 'hover:bg-purple-500/10' },
  { type: 'fire', emoji: '🔥', label: 'Fire', color: 'hover:bg-orange-500/10' },
  { type: 'star', emoji: '⭐', label: 'Amazing', color: 'hover:bg-amber-500/10' },
];

export default function TeenReactionPicker({ onReactionSelect, className }: TeenReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const handleReactionSelect = (type: string) => {
    onReactionSelect(type);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-10 w-10 p-0 hover:bg-primary/10 rounded-full", className)}
          title="Add reaction"
        >
          <Smile className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-3 gap-1">
          {teenReactions.map(({ type, emoji, label, color }) => (
            <Button
              key={type}
              variant="ghost"
              onClick={() => handleReactionSelect(type)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto p-3",
                "border-2 border-transparent hover:border-primary/20 transition-all rounded-lg",
                color
              )}
            >
              <span className="text-3xl">{emoji}</span>
              <span className="text-xs font-medium">{label}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
