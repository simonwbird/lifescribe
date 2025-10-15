export type ReminderType = 
  | 'boiler_service'
  | 'smoke_co_check'
  | 'gutter_clean'
  | 'insurance_renewal'
  | 'warranty_expiry'
  | 'safety_inspection'
  | 'other'

export const REMINDER_TYPES: { value: ReminderType; label: string; icon: string }[] = [
  { value: 'boiler_service', label: 'Boiler Service', icon: '🔥' },
  { value: 'smoke_co_check', label: 'Smoke/CO Alarm Check', icon: '🚨' },
  { value: 'gutter_clean', label: 'Gutter Cleaning', icon: '🌧️' },
  { value: 'insurance_renewal', label: 'Insurance Renewal', icon: '🛡️' },
  { value: 'warranty_expiry', label: 'Warranty Expiry', icon: '📜' },
  { value: 'safety_inspection', label: 'Safety Inspection', icon: '✅' },
  { value: 'other', label: 'Other', icon: '📋' },
]
