import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PersonTag {
  person_id: string
  person_name?: string
  role?: string
  people?: {
    id: string
    given_name: string
    surname: string | null
  }
}

interface PersonChipsProps {
  tags: PersonTag[]
  onPersonClick?: (personId: string, personName: string) => void
  interactive?: boolean
}

export function PersonChips({ tags, onPersonClick, interactive = true }: PersonChipsProps) {
  if (!tags || tags.length === 0) return null

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'subject':
        return 'bg-primary/10 text-primary hover:bg-primary/20'
      case 'author':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20'
      case 'photographer':
      case 'videographer':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20'
      case 'appears':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20'
      case 'mentioned':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
      default:
        return 'bg-secondary hover:bg-secondary/80'
    }
  }

  const getRoleLabel = (role?: string) => {
    if (!role || role === 'subject') return ''
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const personName = tag.person_name || 
          (tag.people ? `${tag.people.given_name} ${tag.people.surname || ''}`.trim() : 'Unknown')
        const personId = tag.person_id || tag.people?.id

        const chipContent = (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="font-medium">{personName}</span>
            {tag.role && tag.role !== 'subject' && (
              <span className="text-xs opacity-75">• {getRoleLabel(tag.role)}</span>
            )}
          </div>
        )

        if (interactive && personId && onPersonClick) {
          return (
            <Badge
              key={personId}
              variant="secondary"
              className={`${getRoleColor(tag.role)} cursor-pointer transition-colors`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onPersonClick(personId, personName)
              }}
            >
              {chipContent}
            </Badge>
          )
        }

        if (interactive && personId) {
          return (
            <Link key={personId} to={`/people/${personId}`}>
              <Badge
                variant="secondary"
                className={`${getRoleColor(tag.role)} cursor-pointer transition-colors`}
              >
                {chipContent}
              </Badge>
            </Link>
          )
        }

        return (
          <Badge
            key={personId || Math.random()}
            variant="secondary"
            className={getRoleColor(tag.role)}
          >
            {chipContent}
          </Badge>
        )
      })}
    </div>
  )
}