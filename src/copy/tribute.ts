/**
 * Copy and messaging for tribute/memory features
 */

export const tributeCopy = {
  memoryCard: {
    title: (firstName: string) => `Share a memory of ${firstName}`,
    helper: "A few sentences is perfect. Add a year or place if you remember.",
    shuffle: "Show another spark",
    captureButtons: {
      write: "Write",
      voice: "Record voice",
      photo: "Add photo"
    }
  },
  
  captureModal: {
    title: (firstName: string) => `Share a memory of ${firstName}`,
    voiceHelper: "Record a short memory (30–90s). We'll transcribe it for you.",
    visibilityLabel: "Who can see this memory?",
    visibilityRequired: "required",
    firstHandLabel: "This is my own memory (I experienced it first-hand)",
    firstHandHelper: "Uncheck if you heard this story from someone else",
    draftSaved: "Your draft is automatically saved as you type",
    submitButton: "Submit Memory",
    saveDraftButton: "Save Draft & Close"
  },
  
  enrichment: {
    addYear: "+ Add year?",
    addPlace: "+ Add place?",
    yearLabel: "When was this?",
    placeLabel: "Where was this?",
    yearPlaceholder: "e.g., 1995 or early 2000s",
    placePlaceholder: "Type a place name...",
    placeSuggestion: "Start typing to see suggestions"
  },
  
  moderation: {
    approved: "Memory approved",
    hidden: "Memory hidden",
    approvedDescription: "The memory has been approved.",
    hiddenDescription: "The memory has been hidden."
  }
} as const
