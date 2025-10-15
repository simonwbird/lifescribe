export type ReminderType = 'vaccination' | 'vet_visit' | 'grooming' | 'medication' | 'other'
export type ReminderStatus = 'pending' | 'completed' | 'cancelled'

export interface PetReminder {
  id: string
  petId: string
  familyId: string
  type: ReminderType
  title: string
  dueDate: string
  status: ReminderStatus
  notes?: string
  createdAt: string
}

export const REMINDER_TYPES: { value: ReminderType; label: string }[] = [
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'vet_visit', label: 'Vet Visit' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'medication', label: 'Medication' },
  { value: 'other', label: 'Other' },
]
