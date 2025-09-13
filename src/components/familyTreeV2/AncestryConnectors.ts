import { CARD_W, CARD_H, PORT_INSET, STEM_LEN, CORNER_RAD, SIB_GAP } from './PersonCard'

type Pt = { x: number; y: number }

function sign(n: number) { 
  return n < 0 ? -1 : n > 0 ? 1 : 0 
}

// Anchor points where lines meet cards
export function topPort(rect: { x: number; y: number }) {
  return { x: rect.x + CARD_W / 2, y: rect.y - PORT_INSET }
}

export function bottomPort(rect: { x: number; y: number }) {
  return { x: rect.x + CARD_W / 2, y: rect.y + CARD_H + PORT_INSET }
}

// Y coordinate for the union bar within the spouse row
export function unionYForRow(rowY: number) {
  return rowY + Math.round(CARD_H * 0.52) // ~108px below card top
}

export function unionBar(a: { x: number; y: number }, b: { x: number; y: number }, rowY: number) {
  const y = unionYForRow(rowY)
  const ax = a.x + CARD_W / 2 // center of left card
  const bx = b.x + CARD_W / 2 // center of right card
  const [x1, x2] = ax < bx ? [ax, bx] : [bx, ax]
  return { x1, x2, y, ax, bx }
}

// Center children under union bar midpoint
export function layoutChildrenXs(childrenCount: number, centerX: number) {
  if (childrenCount === 0) return []
  const totalW = (childrenCount - 1) * SIB_GAP
  const startX = centerX - totalW / 2
  return Array.from({ length: childrenCount }, (_, i) => Math.round(startX + i * SIB_GAP))
}

// Build an orthogonal path through points with rounded corners
export function roundedOrthogonal(points: Pt[], r: number) {
  if (points.length < 2) return ''
  const segs: string[] = []
  const p0 = points[0]
  segs.push(`M${p0.x},${p0.y}`)

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i]
    const prev = points[i - 1]

    // straight segment unless there is a next point (corner)
    const isCorner = i < points.length - 1
    if (!isCorner) {
      segs.push(`L${p1.x},${p1.y}`)
      break
    }

    const next = points[i + 1]
    const vx = sign(p1.x - prev.x) // -1,0,1
    const vy = sign(p1.y - prev.y)
    const nx = sign(next.x - p1.x)
    const ny = sign(next.y - p1.y)

    // distance available before/after the corner
    const preLen = Math.abs((vx !== 0 ? p1.x - prev.x : p1.y - prev.y))
    const postLen = Math.abs((nx !== 0 ? next.x - p1.x : next.y - p1.y))
    const rr = Math.min(r, preLen / 2, postLen / 2)

    // point before the corner
    const bx = p1.x - vx * rr
    const by = p1.y - vy * rr
    segs.push(`L${bx},${by}`)

    // rounded elbow using a quadratic curve via the corner
    const ax = p1.x + nx * rr
    const ay = p1.y + ny * rr
    segs.push(`Q${p1.x},${p1.y} ${ax},${ay}`)
  }
  return segs.join(' ')
}

// Re-export constants needed by ConnectionRenderer
export { STEM_LEN, CORNER_RAD }