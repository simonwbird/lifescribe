// src/lib/timelineBuckets.ts
export type ItemType = 'story' | 'answer'
export type DatePrecision = 'day' | 'month' | 'year'

export interface TimelineItem {
  item_id: string
  item_type: ItemType
  happened_on: string | null // ISO date (YYYY-MM-DD) or null
  occurred_precision?: DatePrecision | null
  is_approx?: boolean | null
  title: string
  excerpt?: string | null
  // optional for thumbnails
  thumbUrl?: string
}

export type ZoomLevel = 'decade' | 'year' | 'month' | 'day'

export interface BucketKey {
  // normalized "start" ISO for the bucket
  iso: string
  // human label for tick/header
  label: string
}

export interface Bucket {
  key: BucketKey
  items: TimelineItem[]
}

export function parseISODate(iso?: string | null): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(+d) ? null : d
}

export function ymd(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function yOnly(d: Date): string {
  return `${d.getFullYear()}-01-01`
}
export function ymOnly(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-01`
}

/** Clamp a viewing window and derive sensible defaults */
export function deriveWindow(items: TimelineItem[], zoom: ZoomLevel): { start: Date; end: Date } {
  const dates = items.map(i => parseISODate(i.happened_on)).filter(Boolean) as Date[]
  const min = dates.length ? new Date(Math.min(...dates.map(d => +d))) : new Date(new Date().getFullYear() - 20, 0, 1)
  const max = dates.length ? new Date(Math.max(...dates.map(d => +d))) : new Date()
  // pad a bit
  const start = new Date(min)
  const end = new Date(max)
  if (zoom === 'decade') { start.setFullYear(start.getFullYear() - 5); end.setFullYear(end.getFullYear() + 5) }
  if (zoom === 'year')   { start.setMonth(0, 1); end.setMonth(11, 31) }
  if (zoom === 'month')  { start.setDate(1); end.setMonth(end.getMonth() + 1, 0) }
  return { start, end }
}

export function labelFor(d: Date, zoom: ZoomLevel): string {
  const y = d.getFullYear()
  const month = d.toLocaleString(undefined, { month: 'short' })
  if (zoom === 'decade') return `${Math.floor(y/10)*10}s`
  if (zoom === 'year') return `${y}`
  if (zoom === 'month') return `${month} ${y}`
  return d.toLocaleDateString() // day
}

/** Normalize a date to the bucket-start for the zoom */
export function bucketStart(d: Date, zoom: ZoomLevel): Date {
  const nd = new Date(d)
  if (zoom === 'decade') nd.setFullYear(Math.floor(nd.getFullYear()/10)*10, 0, 1)
  if (zoom === 'year')   nd.setMonth(0, 1)
  if (zoom === 'month')  nd.setDate(1)
  // 'day' returns same date
  nd.setHours(0,0,0,0)
  return nd
}

/** Bucket items by zoom level; undated items returned separately */
export function bucketize(items: TimelineItem[], zoom: ZoomLevel): { buckets: Bucket[]; undated: TimelineItem[] } {
  const map = new Map<string, Bucket>()
  const undated: TimelineItem[] = []
  for (const it of items) {
    const d = parseISODate(it.happened_on)
    if (!d) { undated.push(it); continue }
    const start = bucketStart(d, zoom)
    const iso = (zoom === 'year') ? yOnly(start) : (zoom === 'month') ? ymOnly(start) : ymd(start)
    const key: BucketKey = { iso, label: labelFor(start, zoom) }
    const bucket = map.get(iso) ?? { key, items: [] }
    bucket.items.push(it)
    map.set(iso, bucket)
  }
  // sort by date asc
  const buckets = Array.from(map.values()).sort((a, b) => a.key.iso.localeCompare(b.key.iso))
  return { buckets, undated }
}

/** Friendly formatter for imprecise/approx dates */
export function formatWhen(it: TimelineItem): string {
  if (!it.happened_on) return 'Undated'
  const d = parseISODate(it.happened_on)!
  const approx = it.is_approx ? '~ ' : ''
  const prec = it.occurred_precision || 'day'
  if (prec === 'year') return `${approx}${d.getFullYear()}`
  if (prec === 'month') {
    const m = d.toLocaleString(undefined, { month: 'short' })
    return `${approx}${m} ${d.getFullYear()}`
  }
  return `${approx}${d.toLocaleDateString()}`
}