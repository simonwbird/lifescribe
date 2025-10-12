import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TOCSection {
  id: string
  label: string
  element?: HTMLElement
}

interface TOCBlockProps {
  className?: string
}

const SECTIONS: Omit<TOCSection, 'element'>[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'bio', label: 'Biography' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'stories', label: 'Stories' },
  { id: 'audio', label: 'Audio' },
  { id: 'voice-notes', label: 'Voice Notes' },
  { id: 'photos', label: 'Photos' },
  { id: 'places', label: 'Places' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'guestbook', label: 'Guestbook' },
  { id: 'notes-from-friends', label: 'Notes from Friends' },
  { id: 'services', label: 'Services' }
]

export default function TOCBlock({ className }: TOCBlockProps) {
  const [activeSection, setActiveSection] = useState<string>('')
  const [visibleSections, setVisibleSections] = useState<TOCSection[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Find all sections that exist on the page
    const foundSections: TOCSection[] = []
    
    SECTIONS.forEach(section => {
      const element = document.getElementById(section.id)
      if (element) {
        foundSections.push({
          ...section,
          element
        })
      }
    })

    setVisibleSections(foundSections)

    // Set up Intersection Observer
    if (foundSections.length > 0) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveSection(entry.target.id)
            }
          })
        },
        {
          rootMargin: '-20% 0px -70% 0px',
          threshold: 0
        }
      )

      // Observe all section elements
      foundSections.forEach(section => {
        if (section.element) {
          observerRef.current?.observe(section.element)
        }
      })
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Smooth scroll to section
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })

      // Update URL hash without jumping
      window.history.pushState(null, '', `#${sectionId}`)

      // Update active state immediately for better UX
      setActiveSection(sectionId)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, sectionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSectionClick(sectionId)
    }
  }

  if (visibleSections.length === 0) {
    return null
  }

  return (
    <Card className={cn("border-border/50 bg-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <List className="h-4 w-4" />
          Table of Contents
        </CardTitle>
      </CardHeader>

      <CardContent>
        <nav aria-label="Page sections">
          <ul className="space-y-1">
            {visibleSections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => handleSectionClick(section.id)}
                  onKeyDown={(e) => handleKeyDown(e, section.id)}
                  className={cn(
                    "w-full text-left text-sm py-1.5 px-2 rounded transition-all",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                    activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground"
                  )}
                  aria-current={activeSection === section.id ? 'location' : undefined}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  )
}
