/**
 * Internationalization types and interfaces
 */

export type SupportedLocale = 'en-GB' | 'en-US' | 'fr-FR' | 'de-DE' | 'es-ES' | 'it-IT'

export interface DateFormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  timeStyle?: 'full' | 'long' | 'medium' | 'short'
  use24Hour?: boolean
  showTimezone?: boolean
}

export interface CurrencyFormatOptions {
  currency?: string
  display?: 'symbol' | 'code' | 'name'
}

export interface AddressFormatOptions {
  style?: 'full' | 'short'
  includeCountry?: boolean
}

export interface LocaleConfig {
  locale: SupportedLocale
  timezone: string
  currency: string
  dateFormat: DateFormatOptions
  addressFormat: AddressFormatOptions
  rtl?: boolean
}

export interface TranslationKeys {
  // Common actions
  'common.save': string
  'common.cancel': string
  'common.delete': string
  'common.edit': string
  'common.add': string
  'common.close': string
  'common.loading': string
  'common.error': string
  'common.success': string
  'common.yes': string
  'common.no': string
  'common.continue': string
  'common.back': string
  'common.next': string
  'common.previous': string
  'common.search': string
  'common.filter': string
  'common.select': string
  'common.clear': string
  'common.all': string
  'common.none': string
  
  // Date/Time
  'date.today': string
  'date.yesterday': string
  'date.tomorrow': string
  'date.thisWeek': string
  'date.nextWeek': string
  'date.thisMonth': string
  'date.nextMonth': string
  'date.thisYear': string
  'date.nextYear': string
  'date.upcoming': string
  'date.past': string
  'date.never': string
  'date.unknown': string
  
  // Months
  'months.january': string
  'months.february': string
  'months.march': string
  'months.april': string
  'months.may': string
  'months.june': string
  'months.july': string
  'months.august': string
  'months.september': string
  'months.october': string
  'months.november': string
  'months.december': string
  
  // Days of week
  'days.monday': string
  'days.tuesday': string
  'days.wednesday': string
  'days.thursday': string
  'days.friday': string
  'days.saturday': string
  'days.sunday': string
  
  // Events
  'events.birthday': string
  'events.anniversary': string
  'events.upcoming': string
  'events.noUpcoming': string
  'events.addBirthday': string
  'events.addPhoto': string
  'events.writeNote': string
  'events.viewAll': string
  
  // People
  'people.age': string
  'people.birthday': string
  'people.anniversary': string
  'people.birthPlace': string
  'people.currentLocation': string
  'people.addPerson': string
  
  // Forms
  'forms.required': string
  'forms.optional': string
  'forms.pleaseSelect': string
  'forms.enterName': string
  'forms.selectDate': string
  'forms.unknownYear': string
  'forms.monthDay': string
  
  // Errors
  'errors.loadFailed': string
  'errors.saveFailed': string
  'errors.deleteFailed': string
  'errors.unauthorized': string
  'errors.notFound': string
  'errors.networkError': string
  'errors.tryAgain': string
  
  // Navigation
  'nav.home': string
  'nav.people': string
  'nav.stories': string
  'nav.photos': string
  'nav.events': string
  'nav.settings': string
  'nav.admin': string
}