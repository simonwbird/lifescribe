import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { FamilyTreeService } from '@/lib/familyTreeV2Service'
import type { TreePerson, TreeFamily, TreeFamilyChild } from '@/lib/familyTreeV2Types'
import { toast } from 'sonner'

interface AncestorFanProps {
  familyId: string
  focusPersonId: string
  generations?: number
  onPersonClick?: (personId: string) => void
}

interface FanSegment {
  person: TreePerson
  level: number
  startAngle: number
  endAngle: number
  innerRadius: number
  outerRadius: number
}

export const AncestorFan: React.FC<AncestorFanProps> = ({
  familyId,
  focusPersonId,
  generations = 5,
  onPersonClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [segments, setSegments] = useState<FanSegment[]>([])
  const [centerPerson, setCenterPerson] = useState<TreePerson | null>(null)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAncestorData()
  }, [familyId, focusPersonId, generations])

  const loadAncestorData = async () => {
    setLoading(true)
    try {
      const data = await FamilyTreeService.getTreeData(familyId, focusPersonId)
      const focusPerson = data.people.find(p => p.id === focusPersonId)
      if (!focusPerson) throw new Error('Focus person not found')

      setCenterPerson(focusPerson)
      
      // Build ancestor tree (parents only)
      const ancestorSegments = buildAncestorFan(
        focusPerson,
        data.people,
        data.families,
        data.children,
        generations
      )
      
      setSegments(ancestorSegments)
    } catch (error) {
      console.error('Error loading ancestor data:', error)
      toast.error('Failed to load ancestor fan')
    } finally {
      setLoading(false)
    }
  }

  const buildAncestorFan = (
    focusPerson: TreePerson,
    people: TreePerson[],
    families: TreeFamily[],
    children: TreeFamilyChild[],
    maxGenerations: number
  ): FanSegment[] => {
    const segments: FanSegment[] = []
    const personMap = new Map(people.map(p => [p.id, p]))
    
    // Recursive function to build ancestor tree
    const buildLevel = (
      person: TreePerson,
      level: number,
      startAngle: number,
      endAngle: number
    ) => {
      if (level >= maxGenerations) return

      // Get parents
      const parentFamilies = children
        .filter(fc => fc.child_id === person.id)
        .map(fc => families.find(f => f.id === fc.family_id))
        .filter(Boolean) as TreeFamily[]

      const parents: TreePerson[] = []
      parentFamilies.forEach(family => {
        if (family.partner1_id) {
          const parent = personMap.get(family.partner1_id)
          if (parent) parents.push(parent)
        }
        if (family.partner2_id) {
          const parent = personMap.get(family.partner2_id)
          if (parent) parents.push(parent)
        }
      })

      if (parents.length === 0) return

      // Calculate segment angles for each parent
      const angleSpan = endAngle - startAngle
      const anglePerParent = angleSpan / parents.length

      parents.forEach((parent, index) => {
        const segmentStart = startAngle + index * anglePerParent
        const segmentEnd = startAngle + (index + 1) * anglePerParent
        
        const innerRadius = 80 + level * 60
        const outerRadius = innerRadius + 55

        segments.push({
          person: parent,
          level,
          startAngle: segmentStart,
          endAngle: segmentEnd,
          innerRadius,
          outerRadius
        })

        // Recurse to next generation
        buildLevel(parent, level + 1, segmentStart, segmentEnd)
      })
    }

    // Start with full circle for first generation parents
    if (focusPerson) {
      buildLevel(focusPerson, 1, 0, 2 * Math.PI)
    }

    return segments
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5))
  }

  const handleFitView = () => {
    setZoom(1)
  }

  const handleExportPDF = () => {
    if (!svgRef.current) return

    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = 800
      canvas.height = 800
      ctx?.drawImage(img, 0, 0, 800, 800)
      
      const link = document.createElement('a')
      link.download = `ancestor-fan-${centerPerson?.given_name || 'family'}.png`
      link.href = canvas.toDataURL()
      link.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const createArcPath = (
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const x1 = centerX + innerRadius * Math.cos(startAngle)
    const y1 = centerY + innerRadius * Math.sin(startAngle)
    const x2 = centerX + outerRadius * Math.cos(startAngle)
    const y2 = centerY + outerRadius * Math.sin(startAngle)
    const x3 = centerX + outerRadius * Math.cos(endAngle)
    const y3 = centerY + outerRadius * Math.sin(endAngle)
    const x4 = centerX + innerRadius * Math.cos(endAngle)
    const y4 = centerY + innerRadius * Math.sin(endAngle)

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0

    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1} Z`
  }

  const renderSegment = (segment: FanSegment, centerX: number, centerY: number) => {
    const { person, startAngle, endAngle, innerRadius, outerRadius } = segment
    
    const path = createArcPath(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle)
    const midAngle = (startAngle + endAngle) / 2
    const textRadius = (innerRadius + outerRadius) / 2
    const textX = centerX + textRadius * Math.cos(midAngle)
    const textY = centerY + textRadius * Math.sin(midAngle)
    
    const displayName = `${person.given_name || ''} ${person.surname || ''}`.trim()
    const birthYear = person.birth_date?.split('-')[0]
    const deathYear = person.death_date?.split('-')[0]
    const years = birthYear || deathYear ? `${birthYear || '?'}–${deathYear || ''}` : ''

    // Calculate text rotation
    let textAngle = midAngle * 180 / Math.PI
    if (textAngle > 90 && textAngle < 270) {
      textAngle += 180 // Flip text if it would be upside down
    }

    return (
      <g key={person.id}>
        <path
          d={path}
          className="fill-primary/20 cursor-pointer hover:fill-primary/40 transition-colors"
          stroke="#8B5CF6" strokeWidth="1"
          onClick={() => onPersonClick?.(person.id)}
        />
        
        <text
          x={textX}
          y={textY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-xs font-medium pointer-events-none"
          transform={`rotate(${textAngle}, ${textX}, ${textY})`}
        >
          <tspan x={textX} dy="-0.3em">{displayName}</tspan>
          {years && <tspan x={textX} dy="1.2em">{years}</tspan>}
        </text>
      </g>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const centerX = 400
  const centerY = 400

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b bg-muted/10">
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleFitView}>
          <Maximize className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline">
            {segments.length} ancestors
          </Badge>
          <Badge variant="outline">
            {generations} generations
          </Badge>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Fan Canvas */}
      <div className="flex-1 overflow-hidden flex items-center justify-center">
        <svg
          ref={svgRef}
          width="800"
          height="800"
          viewBox="0 0 800 800"
          className="border rounded-lg"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Background circles for generations */}
          {Array.from({ length: generations }, (_, i) => (
            <circle
              key={i}
              cx={centerX}
              cy={centerY}
              r={80 + (i + 1) * 60}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.1"
            />
          ))}

          {/* Ancestor segments */}
          {segments.map(segment => renderSegment(segment, centerX, centerY))}

          {/* Center person */}
          {centerPerson && (
            <g transform={`translate(${centerX}, ${centerY})`}>
              <circle
                r={70}
                className="fill-primary/30"
                stroke="#8B5CF6" strokeWidth="2"
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-sm font-semibold"
              >
                <tspan x="0" dy="-0.3em">
                  {centerPerson.given_name} {centerPerson.surname}
                </tspan>
                {centerPerson.birth_date && (
                  <tspan x="0" dy="1.2em" className="text-xs">
                    {centerPerson.birth_date.split('-')[0]}
                  </tspan>
                )}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}