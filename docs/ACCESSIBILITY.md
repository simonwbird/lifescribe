# LifeScribe Accessibility Features

## Simple Mode v2 - Elder-Friendly Design

### Overview
Simple Mode provides an accessible, voice-first experience designed for elderly users and those who prefer simplified interfaces.

### Key Features

#### 1. Read-Aloud (Text-to-Speech)
- **Implementation**: Web Speech API
- **Usage**: Click "Listen" button on any prompt
- **Features**:
  - Slightly slower speech rate (0.85x) for clarity
  - Automatic voice selection
  - Play/pause controls
  - Visual feedback when speaking

**Components**:
- `useSpeechPlayback()` hook - Manages TTS state and playback
- `speak()` utility - Core TTS function
- Integrated into `TodaysPromptCard` and other prompt components

#### 2. Large Touch Targets
- **Minimum size**: 48px (WCAG AAA compliant)
- **Button height**: 3.5rem (56px) minimum
- **Mobile**: 4rem (64px) on mobile devices
- **Focus indicators**: 3px outline with offset

#### 3. High Contrast Design
- **Text scaling**: 1.15x larger than default
- **Button borders**: 2px for better visibility
- **Card shadows**: Enhanced for depth perception
- **Focus states**: High contrast, visible outlines

#### 4. Quick Voice Recording
- **Large record button**: 20rem height, full-width on mobile
- **Visual states**:
  - Default: Primary color with mic icon
  - Recording: Red/destructive color with pulse animation
- **Persistent recording bar**: Fixed bottom bar while recording
- **Audio confirmation dialog**: Preview before saving

#### 5. Audio Confirmation Dialog
Located: `src/components/audio/AudioConfirmDialog.tsx`

**Features**:
- Large play button for audio preview
- Clear "Try Again" and "Keep Recording" options
- High contrast, easy-to-read text
- Accessible button sizes

### Usage Examples

#### Using Text-to-Speech in Components

```tsx
import { useSpeechPlayback } from '@/hooks/useSpeechPlayback'

function MyComponent() {
  const { isPlaying, toggle } = useSpeechPlayback({
    rate: 0.85,
    volume: 1.0
  })

  const handleListen = () => {
    toggle("Text to speak")
  }

  return (
    <Button onClick={handleListen}>
      {isPlaying ? "Stop" : "Listen"}
    </Button>
  )
}
```

#### Direct Speech Utility

```tsx
import { speak, stopSpeaking } from '@/utils/speechUtils'

// Speak with custom options
await speak("Hello world", {
  rate: 0.9,
  pitch: 1.0,
  volume: 1.0,
  onEnd: () => console.log('Finished'),
  onError: (error) => console.error('Error:', error)
})

// Stop any ongoing speech
stopSpeaking()
```

### Styling

#### Applying Simple Mode Styles
Add the `simple-mode` class to any container:

```tsx
<div className="simple-mode">
  {/* Content automatically gets enhanced styling */}
</div>
```

#### CSS Variables
Located: `src/styles/simpleMode.css`

```css
.simple-mode {
  --simple-text-scale: 1.15;
  --simple-button-height: 3.5rem;
  --simple-touch-target: 48px;
}
```

### Best Practices

1. **Always provide visual feedback** for audio states (playing, recording)
2. **Use high contrast** colors for important actions
3. **Provide confirmation dialogs** for destructive or important actions
4. **Test with screen readers** and keyboard navigation
5. **Support reduced motion** preferences
6. **Use semantic HTML** for better screen reader support

### WCAG Compliance

Simple Mode targets **WCAG 2.1 Level AA** compliance:

- ✅ Touch targets minimum 48px
- ✅ Text scaling up to 200%
- ✅ High contrast (4.5:1 for normal text)
- ✅ Keyboard navigation support
- ✅ Focus indicators visible
- ✅ Reduced motion support
- ✅ Descriptive labels and ARIA attributes

### Browser Support

**Text-to-Speech (Web Speech API)**:
- Chrome/Edge: Full support
- Safari: Full support
- Firefox: Partial support (basic TTS)
- Mobile browsers: Generally well-supported

**Fallback**: If TTS not available, buttons are hidden gracefully.

### Future Enhancements

1. Voice selection preferences
2. Speech rate customization
3. Text highlighting during speech
4. Voice commands for navigation
5. Haptic feedback for recording
6. Offline TTS support
