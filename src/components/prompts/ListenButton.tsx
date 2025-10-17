import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSpeechPlayback } from '@/hooks/useSpeechPlayback';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
interface ListenButtonProps {
  text: string;
  promptId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  persona?: string;
}
export function ListenButton({
  text,
  promptId,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = false,
  onPlayStart,
  onPlayEnd,
  persona
}: ListenButtonProps) {
  const {
    track
  } = useAnalytics();
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const {
    isPlaying,
    isLoading,
    speak,
    stop,
    currentText
  } = useSpeechPlayback({
    voice: 'Brian',
    // Premium ElevenLabs voice
    onEnd: () => {
      track({
        event_name: 'tts_play_end',
        properties: {
          prompt_id: promptId,
          text_length: text.length,
          voice: 'elevenlabs_brian',
          speed: playbackSpeed,
          persona
        }
      } as any);
      onPlayEnd?.();
    },
    onError: error => {
      console.error('TTS error:', error);
    }
  });
  const isThisPlaying = isPlaying && currentText === text;
  const handleClick = async () => {
    if (isThisPlaying) {
      stop();
    } else {
      onPlayStart?.();
      track({
        event_name: 'tts_play_start',
        properties: {
          prompt_id: promptId,
          text_length: text.length,
          voice: 'elevenlabs_brian',
          speed: playbackSpeed,
          persona
        }
      } as any);
      await speak(text);
    }
  };
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    track({
      event_name: 'tts_speed_change',
      properties: {
        prompt_id: promptId,
        speed
      }
    } as any);
  };

  // Estimate duration (rough calculation: ~150 words per minute at 1x)
  const estimatedDuration = Math.ceil(text.split(' ').length / (150 * playbackSpeed) * 60);
  return <div className="flex items-center gap-1">
      <Button onClick={handleClick} variant={variant} size={size} className={cn('transition-all', isThisPlaying && 'animate-pulse', className)} aria-label={isThisPlaying ? 'Stop reading prompt' : 'Hear this prompt'} aria-pressed={isThisPlaying}>
        {isLoading ? <>
            <Loader2 className={cn(size === 'icon' ? 'h-5 w-5' : 'h-4 w-4', showLabel && 'mr-2', 'animate-spin')} />
            {showLabel && 'Loading...'}
          </> : isThisPlaying ? <>
            <VolumeX className={cn(size === 'icon' ? 'h-5 w-5' : 'h-4 w-4', showLabel && 'mr-2')} />
            {showLabel && 'Stop'}
          </> : <>
            <Volume2 className={cn(size === 'icon' ? 'h-5 w-5' : 'h-4 w-4', showLabel && 'mr-2')} />
            {showLabel && <>
                
                <span className="hidden sm:inline">{`Listen (${estimatedDuration}s)`}</span>
              </>}
          </>}
      </Button>

      {/* Playback speed control */}
      {showLabel && <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              {playbackSpeed}×
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSpeedChange(0.75)}>
              0.75× Slower
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSpeedChange(1)}>
              1× Normal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSpeedChange(1.25)}>
              1.25× Faster
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSpeedChange(1.5)}>
              1.5× Fast
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>}
    </div>;
}