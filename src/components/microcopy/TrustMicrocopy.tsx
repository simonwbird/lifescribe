// Centralized microcopy for trust and empathy
// Plain English, empathetic, no jargon - consistent verbs (Create, Share, Invite)

export const TrustMicrocopy = {
  // Action verbs - consistent throughout app
  actions: {
    create: "Create",
    share: "Share", 
    invite: "Invite",
    save: "Save",
    delete: "Remove",
    edit: "Edit",
    view: "View",
    download: "Download",
    upload: "Add"
  },

  // Empathetic headlines
  headlines: {
    welcome: "Welcome to your family's story",
    empty_stories: "Ready to capture your first memory?",
    empty_people: "Who would you like to add to your family tree?",
    privacy: "Your memories, your family, your privacy",
    creating: "Building something beautiful together",
    sharing: "Bringing your family closer"
  },

  // Supportive descriptions
  descriptions: {
    getting_started: "We'll help you create a beautiful space where your family can share stories, photos, and memories that matter.",
    privacy_default: "Everything you create is private to your family. Only people you invite can see your memories.",
    safe_space: "This is your safe space to preserve what matters most to your family.",
    memories_matter: "Every story you share helps build your family's legacy.",
    invite_family: "Invite family members to contribute their own stories and memories.",
    no_pressure: "Take your time. There's no rush to fill everything in at once."
  },

  // Encouraging empty states
  empty_states: {
    stories: {
      title: "Your family's stories begin here",
      description: "Share a memory, upload a photo, or record a story to get started.",
      cta: "Create your first memory"
    },
    people: {
      title: "Build your family tree",
      description: "Add family members so everyone can contribute their stories.",
      cta: "Add someone to your family"
    },
    photos: {
      title: "Preserve your precious moments",
      description: "Upload photos that tell your family's story.",
      cta: "Add your first photo"
    },
    feed: {
      title: "Stay connected with family",
      description: "See the latest stories and memories your family is sharing.",
      cta: "Share something new"
    }
  },

  // Privacy reassurances
  privacy: {
    badge_text: "Private by default",
    encryption: "Your content is encrypted and secure",
    family_only: "Only your family can see this",
    no_ads: "No ads, no tracking, no data mining",
    own_data: "You own your data. Export it anytime.",
    delete_anytime: "Delete your account and data anytime"
  },

  // Success messages
  success: {
    story_created: "Your memory has been saved and shared with your family",
    person_added: "Added to your family tree",
    invite_sent: "Invitation sent! They'll receive an email to join your family space",
    photo_uploaded: "Photo added to your family memories",
    settings_saved: "Your preferences have been updated"
  },

  // Error messages - empathetic and helpful
  errors: {
    upload_failed: "Something went wrong uploading your file. Please try again.",
    save_failed: "We couldn't save your changes right now. Your work is safe - please try again.",
    invite_failed: "We couldn't send that invitation. Please check the email and try again.",
    network_error: "Please check your internet connection and try again.",
    generic: "Something unexpected happened. We're looking into it."
  },

  // Loading states - reassuring
  loading: {
    saving: "Saving your memory...",
    uploading: "Adding your photo...",
    loading: "Loading your family space...",
    inviting: "Sending invitation...",
    creating: "Creating your memory..."
  },

  // Confirmation dialogs - clear and non-alarming
  confirmations: {
    delete_story: {
      title: "Remove this memory?",
      description: "This will remove the memory from your family space. You can always create new memories.",
      confirm: "Yes, remove it",
      cancel: "Keep it"
    },
    leave_family: {
      title: "Leave this family space?",
      description: "You'll no longer see or contribute to this family's memories. You can be re-invited anytime.",
      confirm: "Leave family space",
      cancel: "Stay"
    },
    delete_account: {
      title: "Delete your account?",
      description: "This will permanently delete your account and remove you from all family spaces. This can't be undone.",
      confirm: "Delete my account",
      cancel: "Keep my account"
    }
  },

  // Onboarding - warm and welcoming
  onboarding: {
    step1: {
      title: "Welcome! Let's create your family space",
      description: "You're starting something beautiful. We'll help you every step of the way."
    },
    step2: {
      title: "Tell us about your family",
      description: "This helps us create a space that feels like home."
    },
    step3: {
      title: "Invite your family",
      description: "Family members can share stories, photos, and memories together."
    },
    complete: {
      title: "Your family space is ready!",
      description: "Start creating memories that will be treasured for generations."
    }
  }
} as const

// Helper function to get consistent microcopy
export function getMicrocopy(category: keyof typeof TrustMicrocopy, key: string): string {
  const section = TrustMicrocopy[category] as any
  return section?.[key] || key
}