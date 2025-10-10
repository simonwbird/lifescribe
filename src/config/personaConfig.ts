export type PersonaType = 'elder' | 'busy_parent' | 'storyteller' | 'archivist' | 'teen' | 'guest'
export type RecordingMode = 'voice' | 'text' | 'choice'
export type PostRecordAction = 'openMetadataPanel' | 'publish' | 'review'

export interface PersonaConfig {
  defaultMode: RecordingMode
  headline: string // Can include {first_name} placeholder
  subtext?: string
  chips?: string[]
  fontScale?: 'base' | 'lg' | 'xl'
  liveTranscript?: boolean
  streak?: boolean
  showTags?: boolean
  showSeries?: boolean
  showPromptVariations?: boolean
  templateChips?: string[]
  postRecordAction?: PostRecordAction
  privacyToggle?: 'prominent' | 'subtle'
  stickers?: boolean
  showTourAfterSkip?: boolean
  ctaText?: string
  secondaryCtaText?: string
}

export const personaConfigs: Record<PersonaType, PersonaConfig> = {
  elder: {
    defaultMode: 'voice',
    headline: '{first_name}, tell it like you would to the grandkids.',
    subtext: "Don't aim for perfect—aim for true. 60–90 seconds is plenty.",
    chips: ['60–90 sec', 'Private by default'],
    fontScale: 'lg',
    liveTranscript: true,
    streak: true,
    ctaText: 'Start Recording',
    secondaryCtaText: 'Write Instead'
  },
  
  busy_parent: {
    defaultMode: 'voice',
    headline: 'One minute while the kettle boils.',
    subtext: "Don't aim for perfect—aim for true. 60–90 seconds is plenty.",
    chips: ['Quick: 30–60 sec', 'Auto-save on'],
    fontScale: 'base',
    liveTranscript: true,
    streak: true,
    ctaText: 'Start Recording',
    secondaryCtaText: 'Write Instead'
  },
  
  storyteller: {
    defaultMode: 'choice',
    headline: 'Start a new chapter or add to a series.',
    subtext: "Don't aim for perfect—aim for true. 60–90 seconds is plenty.",
    fontScale: 'base',
    showTags: true,
    showSeries: true,
    showPromptVariations: true,
    streak: true,
    ctaText: 'Start Recording',
    secondaryCtaText: 'Write Instead'
  },
  
  archivist: {
    defaultMode: 'voice',
    headline: "Tell the story; we'll fill the details.",
    subtext: "Don't aim for perfect—aim for true. 60–90 seconds is plenty.",
    templateChips: ['Person', 'Object', 'Place', 'Event'],
    fontScale: 'base',
    liveTranscript: true,
    postRecordAction: 'openMetadataPanel',
    ctaText: 'Start Recording',
    secondaryCtaText: 'Choose Template'
  },
  
  teen: {
    defaultMode: 'text',
    headline: 'Drop a 20-second truth.',
    subtext: "Don't aim for perfect—aim for true. 60–90 seconds is plenty.",
    chips: ['Text or voice', 'You control who sees'],
    fontScale: 'base',
    privacyToggle: 'prominent',
    stickers: true,
    streak: true,
    ctaText: 'Start Recording',
    secondaryCtaText: 'Write Instead'
  },
  
  guest: {
    defaultMode: 'choice',
    headline: 'Share one memory of who invited you.',
    subtext: "Don't aim for perfect—aim for true. 60–90 seconds is plenty.",
    chips: ['Voice or text', 'Added to family album'],
    fontScale: 'base',
    showTourAfterSkip: true,
    ctaText: 'Start Recording',
    secondaryCtaText: 'Write Instead'
  }
}

export function getPersonaConfig(persona: PersonaType): PersonaConfig {
  return personaConfigs[persona]
}

export function interpolateHeadline(headline: string, firstName?: string): string {
  if (!firstName) {
    // Remove placeholder if no first name
    return headline.replace(/\{first_name\},?\s*/, '').trim()
  }
  return headline.replace('{first_name}', firstName)
}
