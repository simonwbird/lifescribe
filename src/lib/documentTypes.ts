export const DOCUMENT_TYPES = [
  { value: 'deed', label: 'Deeds' },
  { value: 'survey', label: 'Survey' },
  { value: 'epc', label: 'EPC' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'manual', label: 'Manual' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'planning', label: 'Permit/Planning' },
  { value: 'other', label: 'Other' },
] as const

export type DocumentType = typeof DOCUMENT_TYPES[number]['value']
